// 11 · "Blind guides smile / While the widow pays"
// v2. The film's first full-frame smile: a donation kiosk's screen fills the frame with a glowing
// synthetic customer-service face in neon strokes, grinning. On "Blind" a glitch band slides across
// its eyes; on "smile" the grin widens and the UI flashes green. On "While" the camera tilts down
// and pulls back to what the kiosk feeds: a chrome collection hopper whose throat drains into the
// film's black titanium chalice (cupBlack). Silver microfees drop through into the green on the beats; on
// "widow" a small, thin, warm-lit silhouette at the hopper's lip lets two copper coins go, and on
// "pays" they fall through the throat into the poison and the green flares. The words live on the
// screen's dark side panel, then on a thermal receipt printed from the kiosk (lyric layer).
import { ease, grade, rgb, orbit, linesFrom, spring, clamp } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { E_GLSL } from '/song/lib/x-e.js';
import { HALL_GLSL } from '/song/lib/x-a.js';

const [L1, L2] = linesFrom('Blind guides smile', 'While the widow pays');
export const W11 = {
  blind: L1.words[0].start, smile: L1.words[2].start, while: L2.words[0].start,
  widow: L2.words[2].start, pays: L2.words[3].start,
};
const HX = 1.35, HZ = 0.55;        // the hopper and chalice stand at (HX, HZ), right of the kiosk
const HY = 1.18, HT = 1.52;        // throat height, lip height
const CS = 0.95;                   // chalice scale (rim at ~0.97)
const WX = HX - 0.78;                  // the widow's x

// shot A: square on and close to the kiosk face; shot B: the hopper, chalice and widow
export const camera11 = (P) => (t) => {
  const u = t - P.from;
  const A = { target: [0.1, 1.48, 0], yaw: 0.0, pitch: 0.0, dist: 1.5 - 0.035 * u, fov: 38 };
  const k = ease.inOut3((t - (W11.while - 0.05)) / 0.6);
  const ub = Math.max(0, t - W11.while);
  const kick = t > W11.pays ? 0.12 * spring(t, W11.pays, 0.35, 0.3) : 0;
  const B = { target: [HX + 0.1, 0.92, HZ + 0.2], yaw: 0.22 + 0.012 * ub, pitch: 0.2, dist: 3.6 - 0.08 * ub - kick, fov: 36 };
  const m = (a, b) => a + (b - a) * k;
  return orbit(t, {
    target: A.target.map((v, i) => m(v, B.target[i])), yaw: m(A.yaw, B.yaw), pitch: m(A.pitch, B.pitch),
    dist: m(A.dist, B.dist), fov: m(A.fov, B.fov), drift: 0.004,
  });
};

export default (P) => {
  const t0 = P.from;
  // a coin dropped from the throat at time td falls into the chalice's poison (gone after 0.3 s)
  const fall = (td, dx) => {
    return (t) => {
      const u = t - td;
      if (u < -0.35 || u > 0.3) return [0, 9, 0, 0];
      if (u < 0) return [HX + dx, HY + 0.04, HZ, 0];   // rolling down the hopper, just inside the throat
      return [HX + dx * (1 - u * 2), HY - 4.9 * u * u - 0.04, HZ, u * 30];
    };
  };
  const drops = [fall(W11.while + 0.62, 0.02), fall(W11.while + 1.27, -0.02), fall(W11.pays, 0.015), fall(W11.pays + 0.12, -0.015)];
  return {
    name: 's11-widow', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + CUP_GLSL + HALL_GLSL + E_GLSL + /* glsl */ `
uniform float uBlind, uSmile, uFlash, uTotal, uGreen, uTear, uWidow, uHold;
uniform vec4 uC0, uC1, uC2, uC3;   // falling coins: xyz, spin
const float HX = ${HX.toFixed(3)}, HZ = ${HZ.toFixed(3)}, HY = ${HY.toFixed(3)}, HT = ${HT.toFixed(3)}, CS = ${CS.toFixed(3)}, WX = ${WX.toFixed(3)};
float hopper(vec3 p) {
  vec3 q = p - vec3(HX, 0, HZ);
  float bb = length(q - vec3(0, HY + 0.2, 0)) - 0.6;
  if (bb > 0.05) return bb;
  vec2 r = revo(q);
  float cone = sdSeg(r, vec2(0.05, HY), vec2(0.42, HT)) - 0.007;
  cone = min(cone, length(r - vec2(0.42, HT)) - 0.016);
  // a machined collar at the throat
  cone = min(cone, sdSeg(r, vec2(0.05, HY - 0.03), vec2(0.075, HY + 0.02)) - 0.012);
  return cone;
}
float coinF(vec3 p, vec4 c, float seed) {
  vec3 q = p - c.xyz;
  if (dot(q, q) > 0.01) return length(q) - 0.06;
  q.yz = rot(1.3 + c.w) * q.yz;
  return sdCoin(q, 0.045, 0.0045, seed);
}
float widow(vec3 p) {
  vec3 q = p - vec3(WX, 0, HZ + 0.28);
  float b = length(q - vec3(0, 0.7, 0)) - 0.95;
  if (b > 0.1) return b;
  q.xz = rot(-1.1) * q.xz;
  float d = figure(q * vec3(1.2, 1.0, 1.15), 1.38, 4.0) * 0.83;
  // the coat falls to the ankles
  d = smin(d, sdRoundCone(q, vec3(0, 0.12, 0), vec3(0, 0.9, 0), 0.2, 0.15), 0.08);
  // a veil over the head and shoulders
  d = smin(d, sdRoundCone(q, vec3(0, 1.02, 0), vec3(0, 1.3, 0), 0.19, 0.1), 0.05);
  // her right arm raised to the hopper's lip
  vec3 sh = vec3(0.14, 1.05, 0.0), hd = vec3(0.24, 1.43, 0.36);
  d = smin(d, sdCapsule(q, sh, mix(sh, hd, uHold), 0.036), 0.04);
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  // the kiosk totem: pedestal and the screen housing
  float d = sdRoundBox(p - vec3(0, 0.5, -0.05), vec3(0.42, 0.5, 0.18), 0.02);
  float hs = sdRoundBox(p - vec3(0, 1.5, 0), vec3(0.9, 0.58, 0.06), 0.025);
  if (hs < d) { d = hs; id = 2; }
  // a chrome arm from the kiosk to the hopper's collar
  float arm = sdCapsule(p, vec3(0.8, 1.05, 0.02), vec3(HX - 0.07, HY + 0.02, HZ), 0.018);
  if (arm < d) { d = arm; id = 5; }
  // fluorescent tubes on the far wall, alternating purple and green
  vec3 tp = p - vec3(0, 0, -3.0);
  float cx = clamp(floor(tp.x / 1.1 + 0.5), -4.0, 4.0);
  float tube = tubeLight(tp - vec3(cx * 1.1, 0, 0), vec3(0, 0.3, 0), vec3(0, 3.4, 0));
  if (tube < d) { d = tube; id = mod(cx, 2.0) < 0.5 ? 3 : 4; }
  float h = hopper(p);
  if (h < d) { d = h; id = 5; }
  vec3 cq = (p - vec3(HX, 0, HZ)) / CS;
  float ch = chalice(cq) * CS;
  if (ch < d) { d = ch; id = 7; }
  float lq = cupLiquid(cq, 0.9 + 0.004 * sin(uTime * 3.0 + cq.x * 30.0)) * CS;
  if (lq < d) { d = lq; id = 8; }
  float c = min(coinF(p, uC0, 1.0), coinF(p, uC1, 2.0));
  if (c < d) { d = c; id = 6; }
  float cc = min(coinF(p, uC2, 3.0), coinF(p, uC3, 4.0));
  if (cc < d) { d = cc; id = 9; }
  float w = widow(p);
  if (w < d) { d = w; id = 10; }
  return d;
}
vec3 screenUI(vec2 f) {
  // dark aubergine panel, a header strip, the face left of centre, a text column on the right
  vec3 c = vec3(0.012, 0.006, 0.022);
  c = mix(c, vec3(0.05, 0.02, 0.09), step(0.46, f.y));
  c += vec3(0.25, 1.2, 0.3) * step(length(f - vec2(-0.8, 0.51)), 0.016);
  vec2 fc = f - vec2(-0.2, -0.01);
  c += vec3(0.07, 0.02, 0.12) * smoothstep(0.6, 0.0, length(fc));
  float face = neonFace(fc / 0.5, uSmile, uBlind, 3.0) * step(abs(fc.x), 0.36);
  c += mix(vec3(0.55, 1.7, 0.95), vec3(1.7, 0.3, 1.2), uTear) * face;
  // hairline rules framing the right column and a progress bar for the donation total
  c += vec3(0.1, 0.08, 0.16) * step(abs(f.x - 0.3), 0.0015) * step(abs(f.y), 0.42);
  float bar = step(abs(f.y + 0.4), 0.008) * step(0.36, f.x) * step(f.x, 0.82);
  c += bar * mix(vec3(0.05, 0.05, 0.08), vec3(0.3, 1.4, 0.2), step(f.x, 0.36 + 0.46 * uTotal));
  c = mix(c, vec3(0.3, 1.5, 0.35), uFlash * 0.3);
  return c * scanlines(f.y * 900.0, 1.0);
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) { Mat m = M(vec3(0.04, 0.04, 0.045), 0.3, 0.0); m.clear = 0.8; return dirty(m, p, 0.7); }
  if (id == 2) {
    Mat m = M(vec3(0.03, 0.03, 0.035), 0.2, 0.0); m.clear = 1.0;
    vec2 f = p.xy - vec2(0.0, 1.5);
    if (n.z > 0.9 && abs(f.x) < 0.86 && abs(f.y) < 0.55) { m.emit = screenUI(f) * 1.3; m.rough = 0.04; }
    return m;
  }
  if (id == 3) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(1.6, 0.35, 2.6) * 2.0; return m; }
  if (id == 4) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(0.5, 2.6, 0.6) * 1.6; return m; }
  if (id == 5) { Mat m = CHROME(); m.alb = vec3(0.8, 0.82, 0.86); m.rough = 0.1 + 0.1 * vnoise(p * 30.0); return dirty(m, p, 0.3); }
  if (id == 6) return creditMat(p);
  if (id == 7) {
    return cupBlack((p - vec3(HX, 0, HZ)) / CS, n);
  }
  if (id == 8) {
    Mat m = M(vec3(0.01, 0.03, 0.012), 0.04, 0.0); m.clear = 1.0;
    float sw = fbm(vec3((p.xz - vec2(HX, HZ)) * 14.0, uTime * 0.5), 3);
    m.emit = vec3(0.3, 1.4, 0.2) * (0.7 + pow(smoothstep(0.45, 0.8, sw), 2.0) * 2.0) * uGreen;
    return m;
  }
  if (id == 9) {
    // the widow's coins: worn copper
    float v = smoothstep(0.55, 0.8, fbm(p * 160.0, 3));
    return M(mix(vec3(0.86, 0.46, 0.3), vec3(0.4, 0.3, 0.25), v * 0.7), 0.3 + 0.3 * v, 1.0 - 0.6 * v);
  }
  // the widow: a matte dark silhouette caught by warm light
  Mat m = M(vec3(0.035, 0.03, 0.03), 0.7, 0.0); m.sheen = 1.0;
  m.emit = vec3(0.9, 0.45, 0.14) * pow(1.0 - abs(n.z), 4.0) * 0.5;
  return m;
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('80, 50, 110', 1.2), uCycB: rgb('20, 16, 30', 0.9),
      uFloorCol: rgb('60, 62, 66', 0.8), uFloorRough: 0.08, uFloorGrain: 1.6, uGrime: 0.9,
      uKeyDir: [0.4, 0.85, 0.45], uKeyCol: [3.0, 3.2, 3.8], uKeySize: 0.3,
      uRimA: [3.4, 1.8, 0.7], uRimB: [0.5, 2.2, 0.7],
      uP1: [WX - 0.35, 1.6, HZ - 0.6], uP1c: [3.0, 1.6, 0.6],
      uP2: [HX, 1.3, HZ + 0.1], uP2c: [0.3, 1.6, 0.2],
      uHaze: 0.05, uHazeCol: rgb('60, 40, 80', 0.35),
      uFaces: 0, uFreeze: 0, uHallGlow: 1,
      uBlind: 0, uSmile: 0.55, uFlash: 0, uTotal: 0, uGreen: 1, uTear: 0, uWidow: 0, uHold: 0,
      uC0: [0, 9, 0, 0], uC1: [0, 9, 0, 0], uC2: [0, 9, 0, 0], uC3: [0, 9, 0, 0],
    },
    camera: camera11(P),
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uBlind.value = t < W11.blind ? 0 : ease.out5((t - W11.blind) / 0.25);
      u.uSmile.value = 0.55 + 0.45 * spring(t, W11.smile, 0.4, 0.3);
      u.uFlash.value = t < W11.smile ? 0 : Math.exp(-(t - W11.smile) * 4);
      u.uTotal.value = clamp(0.08 + 0.9 * ease.inOut3((t - t0) / (W11.while - t0 + 0.3)), 0, 1);
      const tear = (tt) => (t >= tt && t < tt + 0.07 ? 1 : 0);
      u.uTear.value = Math.max(tear(W11.blind), tear(W11.pays)) * 0.6;
      // her arm rises to the lip before "widow", lets go on it, and lowers after "pays"
      u.uHold.value = ease.inOut3((t - (W11.widow - 0.7)) / 0.6) * (1 - ease.inOut3((t - (W11.pays + 0.2)) / 0.6));
      [u.uC0, u.uC1, u.uC2, u.uC3].forEach((uc, i) => { uc.value = drops[i](t); });
      const g = (tt) => (t > tt ? Math.exp(-(t - tt - 0.25) * 3) * (t > tt + 0.25 ? 1 : 0) : 0);
      u.uGreen.value = 1 + 0.6 * g(W11.while + 0.62) + 0.6 * g(W11.while + 1.27) + 2.2 * g(W11.pays);
      u.uP2c.value = [0.3 * u.uGreen.value, 1.6 * u.uGreen.value, 0.2 * u.uGreen.value];
    },
    post(t) { return grade(t, { exposure: 1.05, vignette: 0.45, bloom: 0.09 }); },
  };
};
