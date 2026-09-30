// 09 · "You strain a gnat / Let the camel through"
// Outside: a fine gold filter mesh (the content filter) on four thin legs in a wet, hazy hall,
// and caught in it one tiny glitch bug, its body flickering with dead pixels. Macro, pushing in.
// Inside: on "Let" the camera pulls back; on "camel" a huge brass camel drops from above, passes
// straight through the mesh without tearing a wire, and lands on the floor under it on "through".
import { ease, grade, rgb, orbit, keys, spring, linesFrom } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { S0910_GLSL } from '/song/lib/x-s09-s10.js';

const [L1, L2] = linesFrom('You strain a gnat', 'Let the camel through');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
const MESH_H = 1.25;

export function gnatCamera(P) {
  const t0 = P.from;
  const tLet = L2.words[0].start;
  return (t) => {
    const k = ease.inOut3((t - (tLet - 0.25)) / 0.8);
    const u = t - t0;
    return orbit(t, {
      target: [0.0, 1.255 - 0.55 * k, 0],
      yaw: 0.5 + 0.03 * u - 0.2 * k,
      pitch: 0.55 - 0.2 * k,
      dist: 0.36 - 0.02 * u + 3.3 * k,
      fov: 30 + 4 * k, drift: 0.006,
    });
  };
}

export default (P) => {
  const t0 = P.from;
  const tLet = L2.words[0].start;
  const tCam = L2.words.find((w) => /camel/i.test(w.w)).start;
  const tThr = L2.words.find((w) => /through/i.test(w.w)).start;
  const drop = 2.6, g = (2 * drop) / Math.pow(tThr - tCam, 2);
  const camelY = (t) => {
    if (t < tCam) return 50;
    const u = t - tCam;
    const y = drop - 0.5 * g * u * u;
    if (y > 0) return y + 0.25;
    const v = t - tThr;
    return 0.25 + 0.06 * Math.exp(-v * 8) * Math.abs(Math.sin(v * 16));
  };
  const camera = gnatCamera(P);
  return {
    name: 's09-gnat', from: P.from, to: P.to,
    frag: STUDIO_GLSL + S0910_GLSL + /* glsl */ `
uniform float uCamelY, uCamelX, uRun, uScale;
const float MH = ${MESH_H.toFixed(3)};
const float HW = 0.6;
// the filter: a square gold frame, a fine woven mesh, four legs
float sdFilter(vec3 p, out int id) {
  vec3 q = p - vec3(0.0, MH, 0.0);
  float bb = sdBox(q, vec3(HW + 0.05, 0.05, HW + 0.05));
  float legs = sdCapsule(vec3(abs(p.x), p.y, abs(p.z)), vec3(HW - 0.02, 0.0, HW - 0.02), vec3(HW - 0.02, MH, HW - 0.02), 0.012);
  id = 3;
  float d = legs;
  if (bb > 0.03) return min(d, bb);
  float fr = max(sdBox(q, vec3(HW, 0.018, HW)), -sdBox(q, vec3(HW - 0.035, 0.05, HW - 0.035)));
  if (fr < d) { d = fr; id = 3; }
  // the mesh: two sets of fine wires, woven over and under
  const float S = 0.016;
  float gx = (fract(q.x / S) - 0.5) * S, gz = (fract(q.z / S) - 0.5) * S;
  float wv = 0.0012 * sin(q.x / S * 3.14159) * sin(q.z / S * 3.14159);
  // at the very start the wires are fat and overlap like a viper's scales, then thin to a fine mesh
  float wr = mix(0.0016, 0.0062, uScale);
  float wa = length(vec2(gz, q.y - wv)) - wr;
  float wb = length(vec2(gx, q.y + wv)) - wr;
  float mesh = max(min(wa, wb), max(abs(q.x), abs(q.z)) - HW + 0.02);
  if (mesh < d) { d = mesh; id = 2; }
  return d;
}
// the glitch bug, sitting in the middle of the mesh
float sdBug(vec3 p) {
  vec3 q = p - vec3(0.0, MH + 0.0085, 0.0);
  if (length(q) > 0.05) return length(q) - 0.04;
  float d = sdEllipsoid(q - vec3(-0.004, 0.0, 0.0), vec3(0.013, 0.0055, 0.0075));
  d = smin(d, sdSphere(q - vec3(0.011, 0.001, 0.0), 0.0048), 0.003);
  // six wire legs: three a side, bent down to the mesh
  vec3 r = vec3(q.x, q.y, abs(q.z));
  float lx = clamp(floor((r.x + 0.012) / 0.009 + 0.5), 0.0, 2.0) * 0.009 - 0.012;
  d = min(d, sdCapsule(r, vec3(lx, 0.0, 0.004), vec3(lx + 0.004, -0.007, 0.014), 0.0009));
  // antennae
  d = min(d, sdCapsule(r, vec3(0.014, 0.003, 0.002), vec3(0.024, 0.008, 0.007), 0.0006));
  return d;
}
float sdCamel(vec3 p) { return sdCamelAt(p - vec3(uCamelX, uCamelY, 0.0)); }
float mapObj(vec3 p, out int id) {
  float d = sdFilter(p, id);
  float b = sdBug(p);
  if (b < d) { d = b; id = 4; }
  float c = sdCamel(p);
  if (c < d) { d = c; id = 5; }
  float bl = sdBelt(p);
  if (bl < d) { d = bl; id = 6; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 2) {
    Mat m = GOLD(); m.rough = 0.22;
    Mat sc = M(vec3(0.05, 0.08, 0.05), 0.25, 0.6);
    m.alb = mix(m.alb, sc.alb, uScale); m.rough = mix(m.rough, 0.3, uScale);
    return m;
  }
  if (id == 3) { Mat m = GOLD(); m.rough = 0.15 + 0.1 * vnoise(p * 60.0); return dirty(m, p * 2.0, 0.3); }
  if (id == 4) {
    // the bug: black chrome with a scatter of dead pixels flickering cyan and magenta
    Mat m = M(vec3(0.03), 0.12, 1.0);
    vec3 c = floor(p * 900.0);
    float h = hash13(c + floor(uTime * 12.0));
    float px = step(0.8, h);
    m.emit = px * mix(vec3(0.1, 1.0, 0.9), vec3(1.0, 0.15, 0.7), step(0.9, h)) * 2.5;
    return m;
  }
  if (id == 6) return beltMat(p, uRun);
  return camelMat(p);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 118, 104', 1.5), uCycB: rgb('44, 46, 44', 1.1),
      uFloorCol: rgb('80, 82, 78', 0.7), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [0.12, 1.0, -0.1], uKeyCol: [3.2, 2.2, 1.1], uKeySize: 0.3,
      uRimA: [2.6, 2.7, 2.8], uRimB: [3.0, 1.4, 0.4],
      uHaze: 0.07, uHazeCol: [0.08, 0.085, 0.08],
      uCamelY: 50, uCamelX: 0, uRun: 0, uScale: 1,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uCamelY.value = camelY(t);
      u.uRun.value = -0.4 * (t - t0);
      u.uCamelX.value = t > tThr ? -0.4 * (t - tThr) : 0;
      u.uScale.value = 1 - ease.inOut3((t - t0) / 0.45);
      const fl = 0.6 + 0.4 * (Math.sin(t * 37) > 0.2 ? 1 : 0.3);
      setV(u, 'uP1', [0.0, MESH_H + 0.08, 0.05]);
      setV(u, 'uP1c', [0.02 * fl, 0.12 * fl, 0.11 * fl]);
      // a sodium lamp low at the front, for the brass
      setV(u, 'uP2', [1.6, 1.4, 1.8]);
      setV(u, 'uP2c', [9.0, 4.2, 1.2]);
    },
    post(t) { return grade(t, { exposure: 1.05, bloom: 0.08 }); },
  };
};
