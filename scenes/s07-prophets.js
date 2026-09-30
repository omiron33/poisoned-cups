// 07 · "You honor prophets / That your fathers tried to kill"
// Three white memorial pillars (the white towers of the skyline, seen close) stand in the wet hall,
// each crowned with a gold laurel and set with a screen that shows a live heartbeat trace. Cut in
// on a screen: on "kill" the traces go flat, and blood-red coolant breaks from the pillars' bases
// and runs across the concrete toward the lens and into the dark.
import { keys, ease, grade, rgb, linesFrom } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('You honor prophets', 'That your fathers tried to kill');
export const PX = [-1.15, 0, 1.15];
export const prophetTimes = () => ({ tB: L2.words[0].start, tC: L2.words[L2.words.length - 1].start, tRun: L2.words[L2.words.length - 2].start });
export const prophetsCamera = (t0) => {
  const { tB, tC } = prophetTimes();
  return (t) => {
    const d = 0.006 * (Math.sin(t * 0.8) + 0.5 * Math.sin(t * 2.2));
    if (t < tB) {
      const u = t - t0, k = ease.inOut3(u / (tB - t0));
      // opens high and level like the end of the skyline shot, then sinks to a low heroic angle
      const m = ease.inOut3(u / 1.6);
      const pos = [0.3 + 0.2 * m - 0.45 * k + d, 1.45 - 0.95 * m + 0.3 * k, 4.4 + 0.2 * m - 0.5 * k];
      const tg = [0, 0.9 + 0.45 * m - 0.05 * k, 0];
      return { pos, target: tg, fov: 36 + 2 * m, roll: 0.015 * m * (1 - k) };
    }
    if (t < tC) {
      const u = t - tB, k = ease.out3(u / 0.6);
      return { pos: [0.72 - 0.08 * u + d, 1.78, 1.5 - 0.22 * k - 0.05 * u], target: [0.33, 1.72, 0.35], fov: 32, roll: -0.02 };
    }
    const u = t - tC;
    const sh = Math.exp(-u * 8) * Math.sin(u * 55) * 0.01;
    return { pos: [1.25 - 0.04 * u + d, 0.22 + sh + 0.02 * u, 3.4 - 0.12 * u], target: [1.0, 0.55, 0], fov: 40, roll: 0.03 + sh };
  };
};

export default (P) => {
  const t0 = P.from;
  const camera = prophetsCamera(t0);
  const { tC, tRun } = prophetTimes();
  return {
    name: 's07-prophets', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uPh, uDead, uRun;
float pillarX(float x) { return x < -0.575 ? -1.15 : (x > 0.575 ? 1.15 : 0.0); }
// the coolant: a pool at each base and two meandering runs toward the lens, a thin wet slab
float coolant2D(vec2 p) {
  float d = 1e9;
  for (int i = 0; i < 3; i++) {
    float x = -1.15 + 1.15 * float(i);
    float R = 0.5 * (1.0 - exp(-uRun * 2.5));
    d = min(d, length((p - vec2(x, 0.42)) * vec2(1.0, 1.4)) - R);
    for (int j = 0; j < 2; j++) {
      float sgn = float(j) * 2.0 - 1.0;
      float L = 2.9 * (1.0 - exp(-uRun * (0.7 + 0.25 * float(i + j))));
      float zz = clamp(p.y - 0.45, 0.0, L);
      float cx = x + sgn * (0.12 + 0.1 * zz) + 0.06 * sin(zz * 5.0 + float(i) * 2.0 + float(j));
      float w = 0.035 + 0.02 * sin(zz * 9.0 + float(i));
      float dz = max(p.y - 0.45 - L, 0.45 - p.y);
      d = smin(d, max(abs(p.x - cx) - w, dz), 0.06);
    }
  }
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float x0 = pillarX(p.x);
  vec3 q = p - vec3(x0, 0, 0);
  float d = 1e9;
  float bound = sdBox(q - vec3(0, 1.25, 0), vec3(0.5, 1.35, 0.5));
  if (bound < 0.3) {
    // the pillar and its plinth
    d = sdRoundBox(q - vec3(0, 1.25, 0), vec3(0.34, 1.1, 0.34), 0.02);
    // fluting: shallow vertical grooves on every face
    float fl = abs(fract(q.x * 16.0) - 0.5) + abs(fract(q.z * 16.0) - 0.5);
    d += 0.002 * smoothstep(0.35, 0.5, max(abs(fract(q.x * 14.0) - 0.5), abs(fract(q.z * 14.0) - 0.5))) * step(q.y, 2.1) * step(0.35, q.y);
    d = min(d, sdRoundBox(q - vec3(0, 0.09, 0), vec3(0.44, 0.09, 0.44), 0.015));
    d = min(d, sdRoundBox(q - vec3(0, 2.38, 0), vec3(0.4, 0.04, 0.4), 0.01));
    // the screen, set into the front face
    float scr = sdBox(q - vec3(0, 1.7, 0.345), vec3(0.25, 0.2, 0.008));
    if (scr < d) { d = scr; id = 2; }
    // gold laurel: a leafy ring open at the bottom, on the face above the screen
    vec3 w = q - vec3(0, 2.12, 0.37);
    float a = atan(w.y, w.x);
    float leaf = 0.02 * pow(0.5 + 0.5 * sin(a * 15.0 + sign(w.x) * 1.2), 3.0) + 0.003;
    float wr = length(vec2(length(w.xy) - 0.14, w.z * 1.8)) - 0.008 - leaf;
    wr = max(wr, -(w.y + 0.09));
    if (wr < d) { d = wr; id = 3; }
  } else d = bound;
  if (uRun > 0.0 && p.y < 0.05) {
    float c = max(coolant2D(p.xz), p.y - 0.007) ;
    if (c < d) { d = c; id = 4; }
  }
  return d;
}
float ekg(float x) {
  // one beat: a small bump, a sharp spike and a dip
  float f = fract(x);
  return 0.08 * exp(-pow((f - 0.2) * 30.0, 2.0)) + 0.9 * exp(-pow((f - 0.32) * 70.0, 2.0)) - 0.3 * exp(-pow((f - 0.36) * 60.0, 2.0)) + 0.15 * exp(-pow((f - 0.6) * 18.0, 2.0));
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = LACQUER(vec3(0.84, 0.84, 0.82));
    m.rough = 0.18;
    return dirty(m, p * 1.5, 0.35 + 0.4 * smoothstep(0.6, 0.0, p.y));
  }
  if (id == 3) { Mat m = GOLD(); m.rough = 0.2 + 0.1 * vnoise(p * 80.0); return m; }
  if (id == 4) { Mat m = M(vec3(0.34, 0.008, 0.018), 0.14, 0.0); m.clear = 0.6; m.emit = vec3(0.14, 0.0, 0.006); return m; }
  // the screen: dark glass, a heartbeat trace that scrolls, then flatlines
  float x0 = pillarX(p.x);
  vec2 uv = vec2((p.x - x0) / 0.25, (p.y - 1.7) / 0.2);
  float sx = uv.x * 1.2 - uPh * 1.3 + x0 * 0.7;
  float y = mix(ekg(sx) * 0.6 - 0.1, -0.1, uDead);
  float line = smoothstep(0.05, 0.0, abs(uv.y - y)) ;
  float grid = 0.06 * (step(0.96, fract(uv.x * 5.0)) + step(0.96, fract(uv.y * 4.0)));
  Mat m = M(vec3(0.01), 0.05, 0.0); m.clear = 1.0;
  vec3 col = mix(vec3(0.35, 1.0, 0.4), vec3(1.0, 0.2, 0.15), uDead);
  m.emit = col * (line * 3.0 + grid) * (1.0 - 0.6 * uDead * smoothstep(0.0, 1.0, uPh * 0.0 + 1.0)) + vec3(0.02, 0.05, 0.03);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('92, 100, 98', 1.0), uCycB: rgb('26, 30, 32', 1.0),
      uFloorCol: rgb('92, 96, 90', 1.0), uFloorRough: 0.08, uGrime: 0.85,
      uKeyDir: [-0.35, 0.85, 0.45], uKeyCol: [3.8, 4.0, 4.1], uKeySize: 0.25,
      uRimA: [2.0, 2.2, 2.3], uRimB: [1.5, 0.75, 0.28],
      uP1: [0, 0.3, 1.4], uP1c: [0, 0, 0],
      uHaze: 0.05, uHazeCol: [0.07, 0.085, 0.08],
      uFogFar: 26,
      uPh: 0, uDead: 0, uRun: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uPh.value = t - t0;
      u.uDead.value = ease.out3((t - tC) / 0.12);
      u.uRun.value = Math.max(0, t - tRun);
      const r = Math.min(1, Math.max(0, t - tRun) * 1.5);
      u.uP1c.value = [0.6 * r, 0.02 * r, 0.03 * r];
    },
    post(t) { return grade(t, { exposure: 1.05 }); },
  };
};
