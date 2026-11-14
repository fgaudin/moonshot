#!/usr/bin/env python3
"""Generate CAPCOM's voice clips from tools/capcom-phrases.json into audio/capcom-<lang>.js.

The clips are MP3, embedded as base64 in a script (CapcomClips.add(lang, {key: base64})), so they load from
file:// too, where fetch() is blocked. The lab loads the script only when the PAD readback drill is opened.

Dev-only. Needs piper-tts, onnx and soundfile (pip install piper-tts onnx soundfile), the Piper voice model named in the JSON
(https://huggingface.co/rhasspy/piper-voices: <model>.onnx and .onnx.json in --models) and ffmpeg.
  tmp/voice/venv/bin/python tools/capcom-voice.py --models tmp/voice [--lang fr]

How the clips are cut. A digit synthesized alone is a one-word sentence: said like an exclamation, and its quiet
consonants get clipped (the s of "six", the f of "five"); Whisper understood 44 % of the digits of a readout made that
way. So each word is synthesized inside a short phrase and cut out of it: a digit from "ready, four, done." (calm list
intonation), the last digit of a number from "ready, four." (falling, a number that ends), a field name from
"<name>, zero." (rising, it leads into the number). A take approved by ear can be locked: put it in tools/capcom-takes/<lang>/<key>.wav
(mono WAV) and the generator uses it instead of a new synthesis. Piper reports how many samples each phoneme lasts (alignments),
so the cut falls exactly at the commas, whatever the voice's pauses (cutting at silences failed in French, where the
voice hardly pauses). Whisper now gets every digit of a readout. The lab adds the radio sound itself.
"""
import argparse, base64, json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUNCT = set(',.;:!?…')

def synth(voice, text, speaker=None, length_scale=None):
    """audio (float32) and the [start, end) sample range of each phrase between punctuation marks"""
    cfg = SynthesisConfig(speaker_id=speaker, length_scale=length_scale)
    audio, segs, pos = [], [], 0
    for ch in voice.synthesize(text, cfg, include_alignments=True):
        a = ch.audio_float_array.astype(np.float32)
        al = ch.phoneme_alignments or []
        scale = len(a) / max(1, sum(int(x.num_samples) for x in al))   # alignments come in steps of 256 samples
        t, cur = 0.0, None
        for x in al:
            n = int(x.num_samples) * scale
            if x.phoneme in PUNCT or x.phoneme in ('^', '$'):
                if cur: segs.append(cur); cur = None
            elif x.phoneme != ' ' or cur:
                if cur is None: cur = [pos + t, pos + t + n]
                else: cur[1] = pos + t + n
            t += n
        if cur: segs.append(cur)
        audio.append(a); pos += len(a)
    a = np.concatenate(audio)
    return a, [(int(s), int(e)) for s, e in segs], ch.sample_rate

def cut(a, segs, i, sr, follow=True, db=-45, quiet=0.02, before=0.02, after=0.03):
    """phrase i. The alignments mark where Piper says the phonemes end, but the sound runs on: the release of a final
    consonant (the k of « cinq ») or a vowel's decay falls in the following punctuation. So from each aligned edge the
    cut follows the sound outward until it has been quiet for 20 ms. Where the voice runs on into the next word with
    no silence (« six, fin » said as one breath), it stops 60 ms before that word, or it would pick up its first sound
    (« sif »); the same on the left, 40 ms after the previous word. Then a little room and 6 ms fades."""
    s, e = segs[i]
    lo = segs[i - 1][1] if i > 0 else 0
    hi = segs[i + 1][0] if i + 1 < len(segs) else len(a)
    if not follow:   # the aligned word with fixed room (20 ms before, 50 ms after), never into the neighbours
        b = a[max(lo, s - int(0.02 * sr)):min(hi, e + int(0.05 * sr))].copy()
        f = int(0.006 * sr); b[:f] *= np.linspace(0, 1, f); b[-f:] *= np.linspace(1, 0, f)
        return b
    w = int(0.01 * sr); env = np.sqrt(np.convolve(a * a, np.ones(w) / w, mode='same'))
    th, q = 10 ** (db / 20) * np.max(np.abs(a)), int(quiet * sr)
    def edge(start, stop, step):
        k, run = start, 0
        while k != stop and run < q:
            run = run + 1 if env[k] < th else 0
            k += step
        return k - step * run
    left = lo + int(0.04 * sr) if i > 0 else 0
    right = hi - int(0.06 * sr) if i + 1 < len(segs) else len(a)
    s2 = max(min(edge(s, lo, -1), s), min(left, s))
    e2 = min(max(edge(e, hi, 1), e), max(right, e))
    b = a[max(left, s2 - int(before * sr)):min(right, e2 + int(after * sr))].copy() if right > left else a[s:e].copy()
    f = int(0.006 * sr); b[:f] *= np.linspace(0, 1, f); b[-f:] *= np.linspace(1, 0, f)
    return b

def whole(a, sr, db=-50, keep=0.05):
    """a whole line: leading and trailing silence trimmed"""
    env = np.sqrt(np.convolve(a * a, np.ones(int(0.01 * sr)) / int(0.01 * sr), mode='same'))
    idx = np.where(env > 10 ** (db / 20) * max(1e-6, np.max(np.abs(a))))[0]
    if not len(idx): return a
    return a[max(0, idx[0] - int(keep * sr)):min(len(a), idx[-1] + int(keep * sr))]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--models', required=True, help='folder holding the .onnx voice models')
    ap.add_argument('--lang', help='only this language')
    ap.add_argument('--only', help='comma-separated clip keys (e.g. d1,d9): redo only these, keep the others of the existing file')
    a = ap.parse_args()
    cfg = json.load(open(os.path.join(ROOT, 'tools', 'capcom-phrases.json'), encoding='utf-8'))
    for lang, ph in cfg['phrases'].items():
        if a.lang and lang != a.lang: continue
        vc = cfg['voices'][lang]
        voice = PiperVoice.load(os.path.join(a.models, vc['model'] + '.onnx'), include_alignments=True)
        say = lambda text, ls=None: synth(voice, text, vc.get('speaker'), ls)
        ready, done = ph['frame']
        audio = {}
        only = set(a.only.split(',')) if a.only else None
        def phrase(text, i, n, key):
            if only is not None and key not in only: return
            # slow: per-clip speaking rate (above 1 is slower), for a word the voice says too briefly (French « un »)
            x, segs, sr = say(text, ph.get('slow', {}).get(key.replace('_end', '')))
            if len(segs) != n: raise RuntimeError(f'{lang} {key}: {len(segs)} phrases in {text!r}, {n} expected')
            audio[key] = (cut(x, segs, i, sr, ph.get('cut', 'follow') == 'follow'), sr)
        # digits, point and minus: the middle of "ready, X, done."
        for k, w in zip(['d%d' % i for i in range(10)] + ['point', 'minus'], ph['digits'] + [ph['point'], ph['minus']]):
            phrase(f'{ready}, {w}, {done}.', 1, 3, k)
        # the last digit of a number: the end of "ready, X."
        for i, w in enumerate(ph['digits'] if ph.get('final_digits', True) else []):
            if 'd%d' % i in ph.get('no_final', []): continue
            phrase(f'{ready}, {w}.', 1, 2, 'd%d_end' % i)
        # field names: the start of "<name>, <zero>."
        for k, name in ph['fields'].items():
            phrase(f"{name}, {ph['digits'][0]}.", 0, 2, k)
        for k, text in ph['lines'].items():
            if only is not None and k not in only: continue
            x, _, sr = say(text); audio[k] = (whole(x, sr), sr)
        # locked takes: a clip approved by ear is kept as tools/capcom-takes/<lang>/<key>.wav and used instead of a new
        # synthesis (Piper gives a slightly different take on every run)
        takes = os.path.join(ROOT, 'tools', 'capcom-takes', lang)
        for k in list(audio):
            f = os.path.join(takes, k + '.wav')
            if os.path.exists(f):
                x, sr = sf.read(f, dtype='float32'); audio[k] = (x, sr); print(f'  {lang} {k}: locked take')
        tmp = tempfile.mkdtemp(); clips = {}
        dest = os.path.join(ROOT, 'audio', f'capcom-{lang}.js')
        if only is not None:   # start from the existing clips, approved by ear
            src = open(dest, encoding='utf-8').read()
            clips, _ = json.JSONDecoder().raw_decode(src[src.index('{'):])
            for d in ph.get('no_final', []): clips.pop(d + '_end', None)
        for k, (x, sr) in audio.items():
            raw, mp3 = os.path.join(tmp, k + '.f32'), os.path.join(tmp, k + '.mp3')
            x.astype(np.float32).tofile(raw)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', raw,
                            '-ac', '1', '-ar', '22050', '-b:a', '48k', mp3], check=True)
            clips[k] = base64.b64encode(open(mp3, 'rb').read()).decode()
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(f"/* CAPCOM voice clips ({lang}), generated by tools/capcom-voice.py. Voice: {vc['model']}, "
                    f"{vc['license']}. Do not edit. */\n")
            meta = {'gap': ph.get('digit_gap', 0.03), 'pointGap': ph.get('point_gap', ph.get('digit_gap', 0.03))}
            f.write(f"CapcomClips.add('{lang}', {json.dumps(clips, indent=0)}, {json.dumps(meta)});\n")
        print(lang, len(clips), 'clips ->', os.path.relpath(dest, ROOT), os.path.getsize(dest) // 1024, 'KB')

if __name__ == '__main__':
    sys.exit(main())
