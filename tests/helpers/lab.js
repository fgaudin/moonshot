// The Earth–Moon lab's run options and verdicts, mirroring js/ch/moon.js (MoonLab: MCC_T, simOpts, inCorridor).
// If those change in moon.js, change them here too (tests/moon.test.js checks the constants still match).
const { Phys } = require('./chapter.js');
const MCC_T = 26.7 * 3600;
const fly = (p, model = 'patched') => (model === 'three' ? Phys.simulateTLI : Phys.simulatePatched)({
  dv: p.dv, burnAngle: p.ang, mcc: { t: MCC_T, dv: p.mcc || 0 }, loi: null });
const { periLow: CLO, periHigh: CHI } = Phys.C.corridor;   // the shared entry corridor, 12 to 65 km
const inCorridor = (s) => s.outcome === 'entry' && s.retAlt >= CLO && s.retAlt <= CHI && s.minM.alt < 20000e3;
const km = (m) => m / 1000;
module.exports = { MCC_T, fly, inCorridor, km };
