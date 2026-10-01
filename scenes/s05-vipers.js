// 05 · "Brood of vipers / Who warned you from the fire?"  (v2, hook rung 1: the sleeping nest)
// A dark server aisle seen low down its length: rack rows either side, cold fluorescent tubes
// overhead mirrored in wet concrete. v4: real snakes (lib/x-v4-snake.js) lie coiled between the
// racks, heads resting on their coils, slit eyes glowing dim green, current pulses along their
// spines. On "vipers" the nearest head lifts off its coil and its slit brightens; on "fire?" every
// head turns toward the fire, tongues flicking. At the far end
// an alarm heat shimmer, and a low wall of flame that grows through the line, doubled in the
// polished floor. Punches on "Brood" and "vipers"; a snap zoom toward the fire on "fire?".
import { ease, grade, rgb, linesAt, clamp01, spring, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { XB_GLSL } from '/song/lib/x-b.js';
import { SNAKE_GLSL } from '/song/lib/x-v4-snake.js';
import { S05_GLSL } from '/song/lib/x-v4s-s05.js';

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const tB = L1.words[0].start, tV = L1.words[2].start, tW = L2.words[0].start, tF = L2.words[L2.words.length - 1].start;
  const fireAt = (t) => 0.12 + 0.25 * ease.inOut3((t - tW) / 1.4) + 0.55 * ease.out5((t - tF + 0.03) / 0.35);
  const tearAt = (t) => [tB, tV, tF].reduce((a, h) => Math.max(a, t >= h && t < h + 0.1 ? 1 - (t - h) / 0.1 : 0), 0);
  const camera = (t) => {
    const u = t - t0;
    const push = ease.inOut3(u / 5.0);
    const pB = spring(t, tB - 0.02, 0.35, 0.3), pV = spring(t, tV - 0.02, 0.35, 0.3);
    const zf = spring(t, tF - 0.03, 0.4, 0.2);
    const d = 0.01 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.1 + 1.0));
    const z = 3.0 - 0.9 * push - 0.25 * pB - 0.25 * pV;
    const y = 0.62 - 0.08 * pB - 0.05 * pV;
    return { pos: [0.18 + d, y + d * 0.5, z], target: [mix(-0.05, 0.0, zf) + d, mix(0.35, 0.55, zf), -4.0], fov: mix(46, 30, zf), roll: 0.015 * pV - 0.02 * zf + d * 0.2 };
  };
  return {
    name: 's05-vipers', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + VIPER_GLSL + XB_GLSL + SNAKE_GLSL + S05_GLSL + /* glsl */ `
uniform float uFire, uTear, uLift, uTurn, uSlit;
int gSidK = 0;
const float ZC = -2.0, FZ = -6.4;
float racksL(vec3 p) { return sdRacks(vec3(-(p.z - ZC), p.y, p.x), -1.3, 0.64, 2.3, 0.04, 7.0); }
float racksR(vec3 p) { return sdRacks(vec3(p.z - ZC, p.y, -p.x), -1.3, 0.64, 2.3, 0.04, 7.0); }
float tubes(vec3 p) {
  vec3 q = p - vec3(0.0, 2.45, 0.0);
  q.x = abs(q.x) - 0.5;
  q.z = mod(q.z + 0.8, 1.6) - 0.8;
  return sdCapsule(q, vec3(0, 0, -0.5), vec3(0, 0, 0.5), 0.022);
}
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = racksL(p);
  float v = racksR(p); if (v < d) { d = v; id = 3; }
  v = tubes(p); if (v < d) { d = v; id = 4; }
  // the far wall where the fire stands
  v = sdBox(p - vec3(0.0, 1.2, FZ), vec3(1.3, 1.3, 0.04)); if (v < d) { d = v; id = 5; }
  float b = length(p - vec3(0.0, 0.2, -0.6)) - 2.4;
  if (b > 0.25) return min(d, b);
  float T = uTime;
  // tongues flick in quick bursts once the heads turn to the fire
  gSkFlick = uTurn > 0.3 ? pow(max(0.0, sin(T * 26.0)), 2.0) : -1.0;
  // rest headings (world angle atan(z, x)) blend to the bearing of the fire (0, FZ)
  #define TOFIRE(b) atan(FZ - b.z, -b.x)
  #define HEAD(b, rest) mix(rest, TOFIRE(b) + 6.2831853 * floor((rest - TOFIRE(b)) / 6.2831853 + 0.5), uTurn)
  vec3 b1 = vec3(0.32, 0.0, 0.75), b2 = vec3(-0.5, 0.0, -0.5), b3 = vec3(0.5, 0.0, -1.85), b4 = vec3(-0.42, 0.0, -2.9);
  v = snakeCoilH(p, b1, 0.3, 0.085, 2.3, 0.0, HEAD(b1, 2.55), uLift);           if (v < d) { d = v; id = 1; keepSnake(); gSidK = 1; }
  v = snakeCoilH(p, b2, 2.0, 0.08, 2.1, 1.0, HEAD(b2, 1.2), 0.0);             if (v < d) { d = v; id = 1; keepSnake(); gSidK = 2; }
  v = snakeCoilH(p, b3, 4.0, 0.075, 1.9, 2.0, HEAD(b3, 2.3), 0.0);            if (v < d) { d = v; id = 1; keepSnake(); gSidK = 3; }
  v = snakeCoilH(p, b4, 1.0, 0.07, 1.8, 3.0, HEAD(b4, 0.4), 0.0);             if (v < d) { d = v; id = 1; keepSnake(); gSidK = 4; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    // dim slits at rest; the nearest brightens on "vipers", all flare when they turn to the fire
    float k = 0.35 + 0.65 * uTurn + (gSidK == 1 ? uSlit : 0.0);
    gSkEye = vec3(0.55, 3.4, 0.45) * k;
    return snakeMat(p, n, 0.0);
  }
  if (id == 4) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(7.0, 7.4, 8.0); return m; }
  if (id == 5) {
    Mat m = M(vec3(0.02, 0.02, 0.025), 0.6, 0.0);
    // the wall of low flame, a flat emissive sheet (so the wet floor mirrors it)
    float h = 0.25 + 1.6 * uFire;
    float fn = fbm(vec2(p.x * 2.4, p.y * 1.7 - uTime * 3.2), 4);
    float k = sat(fn * 1.7 - p.y / h);
    m.emit = vec3(3.6, 0.75, 0.1) * smoothstep(0.02, 0.5, k) * 0.9 + vec3(4.0, 2.6, 1.2) * pow(sat(k * 1.3), 4.0) * 1.1;
    return m;
  }
  vec3 lp = id == 2 ? vec3(-(p.z - ZC), p.y, p.x) : vec3(p.z - ZC, p.y, -p.x);
  vec3 ln = id == 2 ? vec3(-n.z, n.y, n.x) : vec3(n.z, n.y, -n.x);
  Mat m = rackMat(lp, ln, -1.3, uTime);
  // far doors: average the fine perforation (it moires), keep 1U seams
  float far = smoothstep(1.6, 3.2, length(p - uCamPos));
  m.alb = mix(m.alb, vec3(0.3, 0.31, 0.33) * 0.72, far);
  m.alb *= 1.0 - 0.35 * smoothstep(0.1, 0.0, abs(fract(p.y / 0.0445 * 0.25) - 0.5) - 0.44) * step(0.7, ln.z);
  // status LEDs in toxic green and purple rather than amber
  m.emit = vec3(m.emit.g * 0.25, m.emit.g, m.emit.g * 0.35) * 0.9 + vec3(m.emit.r - m.emit.g, 0.0, (m.emit.r - m.emit.g) * 1.2) * 0.8;
  // the racks nearest the fire glow on their edges
  m.emit += vec3(1.2, 0.3, 0.05) * uFire * smoothstep(-3.5, -6.2, p.z) * step(0.7, ln.z) * 0.3;
  return dirty(m, p, 0.7);
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  // heat shimmer round the far end of the aisle (the middle of the frame)
  fc = heatWarp(fc, 0.35 + 1.4 * uFire, uRes.y * 0.46, uRes.y * 0.14);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  col *= scanlines(fc.y, 1.3) * 0.08 + 0.92;
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('46, 24, 62', 1.2), uCycB: rgb('14, 8, 22', 1.1),
      uFloorCol: rgb('70, 70, 78', 0.8), uFloorRough: 0.12, uGrime: 0.9,
      uKeyDir: [0.1, 1.0, 0.25], uKeyCol: [1.7, 1.8, 2.1], uKeySize: 0.5, uExpo: 1.15,
      uRimA: [0.9, 0.3, 1.5], uRimB: [0.3, 1.6, 0.5],
      uHaze: 0.045, uHazeCol: [0.035, 0.03, 0.05],
      uFire: 0.1, uTear: 0, uLift: 0, uTurn: 0, uSlit: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const f = fireAt(t);
      u.uFire.value = f; u.uTear.value = tearAt(t);
      u.uLift.value = 0.13 * spring(t, tV - 0.06, 0.45, 0.35) * (1 - 0.75 * ease.inOut3((t - tF + 0.12) / 0.32));
      u.uSlit.value = 1.6 * ease.out3((t - tV + 0.05) / 0.2);
      u.uTurn.value = ease.inOut3((t - tF + 0.12) / 0.32);
      const fl = (0.85 + 0.15 * Math.sin(t * 23.0) * Math.sin(t * 7.3)) * f;
      u.uP1.value = [0.0, 0.5, -5.8]; u.uP1c.value = [12 * fl, 3 * fl, 0.6 * fl];
      u.uP2.value = [0.7, 1.3, 2.0]; u.uP2c.value = [2.6, 2.9, 3.6];
      u.uHazeCol.value = [0.035 + 0.05 * f, 0.03 + 0.012 * f, 0.05];
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.09 }); },
  };
};
