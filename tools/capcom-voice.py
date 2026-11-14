#!/usr/bin/env python3
"""Generate CAPCOM's voice clips from tools/capcom-phrases.json into audio/capcom-<lang>.js.

The clips are MP3, embedded as base64 in a script (CapcomClips.add(lang, {key: base64})), so they load from
file:// too, where fetch() is blocked. The lab loads the script only when the PAD readback drill is opened.

Dev-only. Needs piper-tts and onnx (pip install piper-tts onnx), the Piper voice model named in the JSON
(https://huggingface.co/rhasspy/piper-voices: <model>.onnx and .onnx.json in --models) and ffmpeg.
  tmp/voice/venv/bin/python tools/capcom-voice.py --models tmp/voice [--lang fr]

How the clips are cut. A digit synthesized alone is a one-word sentence: said like an exclamation, and its quiet
consonants get clipped (the s of "six", the f of "five"); Whisper understood 44 % of the digits of a readout made that
way. So each word is synthesized inside a short phrase and cut out of it: a digit from "ready, four, done." (calm list
intonation), the last digit of a number from "ready, four." (falling, a number that ends), a field name from
"<name>, zero." (rising, it leads into the number). Piper reports how many samples each phoneme lasts (alignments),
so the cut falls exactly at the commas, whatever the voice's pauses (cutting at silences failed in French, where the
voice hardly pauses). Whisper now gets every digit of a readout. The lab adds the radio sound itself.
"""
import argparse, base64, json, os, subprocess, sys, tempfile
import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUNCT = set(',.;:!?…')

def synth(voice, text, speaker=None):
    """audio (float32) and the [start, end) sample range of each phrase between punctuation marks"""
    cfg = SynthesisConfig(speaker_id=speaker)
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

def cut(a, segs, i, sr, before=0.02, after=0.05):
    """phrase i, with a little room on each side (never into the neighbouring phrase) and 6 ms fades"""
    s, e = segs[i]
    lo = segs[i - 1][1] if i > 0 else 0
    hi = segs[i + 1][0] if i + 1 < len(segs) else len(a)
    b = a[max(lo, s - int(before * sr)):min(hi, e + int(after * sr))].copy()
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
    a = ap.parse_args()
    cfg = json.load(open(os.path.join(ROOT, 'tools', 'capcom-phrases.json'), encoding='utf-8'))
    for lang, ph in cfg['phrases'].items():
        if a.lang and lang != a.lang: continue
        vc = cfg['voices'][lang]
        voice = PiperVoice.load(os.path.join(a.models, vc['model'] + '.onnx'), include_alignments=True)
        say = lambda text: synth(voice, text, vc.get('speaker'))
        ready, done = ph['frame']
        audio = {}
        def phrase(text, i, n, key):
            x, segs, sr = say(text)
            if len(segs) != n: raise RuntimeError(f'{lang} {key}: {len(segs)} phrases in {text!r}, {n} expected')
            audio[key] = (cut(x, segs, i, sr), sr)
        # digits, point and minus: the middle of "ready, X, done."
        for k, w in zip(['d%d' % i for i in range(10)] + ['point', 'minus'], ph['digits'] + [ph['point'], ph['minus']]):
            phrase(f'{ready}, {w}, {done}.', 1, 3, k)
        # the last digit of a number: the end of "ready, X."
        for i, w in enumerate(ph['digits']):
            phrase(f'{ready}, {w}.', 1, 2, 'd%d_end' % i)
        # field names: the start of "<name>, <zero>."
        for k, name in ph['fields'].items():
            phrase(f"{name}, {ph['digits'][0]}.", 0, 2, k)
        for k, text in ph['lines'].items():
            x, _, sr = say(text); audio[k] = (whole(x, sr), sr)
        tmp = tempfile.mkdtemp(); clips = {}
        for k, (x, sr) in audio.items():
            raw, mp3 = os.path.join(tmp, k + '.f32'), os.path.join(tmp, k + '.mp3')
            x.astype(np.float32).tofile(raw)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', raw,
                            '-ac', '1', '-ar', '22050', '-b:a', '48k', mp3], check=True)
            clips[k] = base64.b64encode(open(mp3, 'rb').read()).decode()
        dest = os.path.join(ROOT, 'audio', f'capcom-{lang}.js')
        with open(dest, 'w', encoding='utf-8') as f:
            f.write(f"/* CAPCOM voice clips ({lang}), generated by tools/capcom-voice.py. Voice: {vc['model']}, "
                    f"{vc['license']}. Do not edit. */\n")
            f.write(f"CapcomClips.add('{lang}', {json.dumps(clips, indent=0)});\n")
        print(lang, len(clips), 'clips ->', os.path.relpath(dest, ROOT), os.path.getsize(dest) // 1024, 'KB')

if __name__ == '__main__':
    sys.exit(main())
