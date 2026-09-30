// test of the weapon idioms (not in the film)
import { linesFrom, arm, strike, slash, glitch, lockOn, redact } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
const [L1, L2] = linesFrom('You polish cups', 'Leave the poison in');
export default (P) => ({
  textSize: [3840, 2160], shade: 0.5,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    arm(ctx, L1.words, t, (w, i) => [strike, slash, glitch][i % 3], { x: 240, y: 500, px: 260 });
    arm(ctx, L2.words, t, (w, i) => [lockOn, redact][i % 2], { x: 240, y: 1300, px: 260, tag: 'TARGET 0' + 1 });
  },
});
