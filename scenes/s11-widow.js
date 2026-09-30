// 11 · "Blind guides smile / While the widow pays"
// A sleek payment terminal on a wet concrete floor, its screen a glossy "VERIFIED GUIDE" UI: a gold
// badge with a check, five gold stars, a THANK YOU button (the UI's words are set in the lyric layer,
// pinned to the screen). On "Blind" a black blindfold bar slides across the badge; on "smile" the UI
// flashes bright green: APPROVED. Beside it the film's titanium chalice, acid green glinting inside. Sub-cut
// on "While" to a high angle over the cup with the screen beyond; on "pays" the camera snaps in as
// two worn copper coins clink on the chalice's rim. The screen stays APPROVED.
import { keys, ease, grade, rgb, orbit, linesFrom, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { GLOVE_GLSL } from '/song/lib/x-gloves.js';

const [L1, L2] = linesFrom('Blind guides smile', 'While the widow pays');
const wSmile = L1.words.find((w) => /smile/i.test(w.w)).start;
const wBlind = L1.words[0].start;
const wWidow = L2.words.find((w) => /widow/i.test(w.w)).start;
const wPays = L2.words.find((w) => /pays/i.test(w.w)).start;

const CS = 0.85, CP = [0.4, 0, 0.25];
const SLOT = [CP[0], 0.72, CP[2]];   // where a coin meets the poison in the bowl
const DROP = 0.5;   // seconds from release to the slot

export default (P) => {
  const t0 = P.from, t1 = P.to;
  const wWhile = L2.words[0].start;
  const camera = (t) => {
    const u = t - t0;
    if (t < wWhile) {
      return orbit(t, { target: [0, 0.75, 0], yaw: 0.5 - 0.04 * u, pitch: 0.12 + 0.02 * u, dist: 3.5 - 0.12 * u, fov: 34, drift: 0.006 });
    }
    const ub = t - wWhile;
    const k = ease.out5((t - (wPays - 0.55)) / 0.2);
    // the sub-cut lands still moving: a push-in that decelerates over 0.5 s (30 frames), so the
    // cut never reads as a fast move that stops dead
    const st = 1 - ease.out3(ub / 0.5);
    return orbit(t, { target: [0.24 + 0.06 * k, 1.0 - 0.08 * k, 0.0 + 0.05 * k], yaw: 0.3 + 0.03 * ub + 0.05 * st, pitch: 0.4 + 0.02 * ub + 0.06 * k, dist: 2.35 - 0.06 * ub - 0.3 * k + 0.35 * st, fov: 36, drift: 0.005 });
  };
  const coinAt = (t, tIn, side) => {
    // released DROP s before tIn above the rim, strikes the rim on tIn with a clink, and bounces
    // outward off the plinth, spinning, out of frame
    const x = t - (tIn - DROP);
    if (x < -2) return [0, 9, 0, 0];
    const rimX = CP[0] + side * 0.27, rimY = 0.875, top = rimY + 0.9;
    const g = 2 * 0.9 / (DROP * DROP);
    if (t < tIn) return [rimX, x < 0 ? top : top - 0.5 * g * x * x, CP[2], x * 2.0 + side];
    const u = t - tIn;
    return [rimX + side * 1.1 * u, rimY + 1.1 * u - 4.9 * u * u, CP[2] + 0.5 * u, side + DROP * 2.0 + u * 22.0];
  };
  return {
    name: 's11-widow', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CUP_GLSL + GLOVE_GLSL + /* glsl */ `
uniform vec4 uC1, uC2;     // coin centre xyz, wobble angle
uniform float uGlow, uBlind, uFlash, uOk;
float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994, -0.587785252), k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x); p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
uniform vec4 uGlove;   // xyz cuff position, w tilt; y > 5 means gone
uniform vec4 uDrop;    // a green droplet flicked out of the cup by the clink (xyz, radius)
vec3 gloveLocal(vec3 p) { vec3 q = (p - uGlove.xyz) / 1.3; q.xy = rot(3.1416 + uGlove.w) * q.xy; return q; }
const vec3 SLOT = vec3(${SLOT.join(', ')});
const vec3 CP = vec3(${CP.join(', ')});
const float CS = ${CS.toFixed(3)};
const vec3 TERM = vec3(-0.42, 0.0, -0.2);
float coinD(vec3 p, vec4 c, float seed) {
  vec3 q = p - c.xyz;
  if (dot(q, q) > 0.04) return length(q) - 0.1;
  q.xy = rot(c.w * 0.25) * q.xy;
  // standing on its edge, face along z
  float d = sdCoin(q.xzy, 0.055, 0.0055, seed);
  return d;
}
float headD(vec3 p) {
  vec3 q = p - TERM - vec3(0.0, 1.36, -0.08);
  q.yz = rot(0.42) * q.yz;
  return sdRoundBox(q, vec3(0.33, 0.24, 0.035), 0.02);
}
float mapObj(vec3 p, out int id) {
  id = 1;
  if (length(p - vec3(0, 0.8, 0)) > 1.6) return length(p - vec3(0, 0.8, 0)) - 1.5;
  // the terminal's pedestal: brushed steel, a plinth foot
  vec3 pt = p - TERM;
  float d = sdRoundBox(pt - vec3(0, 0.56, 0), vec3(0.27, 0.55, 0.2), 0.03);
  d = min(d, sdRoundBox(pt - vec3(0, 0.03, 0), vec3(0.34, 0.03, 0.27), 0.01));
  // the head: a slanted tablet with the screen on its face
  float h = headD(p);
  if (h < d) { d = h; id = 2; }
  // the chalice, and the poison in it
  vec3 cq = (p - CP) / CS;
  float ch = chalice(cq) * CS;
  if (ch < d) { d = ch; id = 3; }
  float liq = cupLiquid(cq, SLOT.y / CS) * CS;
  if (liq < d) { d = liq; id = 4; }
  // the white glove that just paid nothing, withdrawing past the cup
  if (uGlove.y < 5.0) {
    vec3 gq = gloveLocal(p);
    float gb = gloveBound(gq) * 1.3;
    float gl = gb > 0.1 ? gb : glove(gq, vec3(0.25, 0.1, 0.2), 1.0) * 1.3;
    if (gl < d) { d = gl; id = 6; }
  }
  if (uDrop.w > 0.0) {
    float dr = length(p - uDrop.xyz) - uDrop.w;
    if (dr < d) { d = dr; id = 7; }
  }
  float c1 = coinD(p, uC1, 1.0), c2 = coinD(p, uC2, 2.0);
  if (min(c1, c2) < d) { d = min(c1, c2); id = 5; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    // brushed gunmetal with grime at the foot
    float br = vnoise(vec2(p.y * 900.0, p.x * 3.0));
    Mat m = M(vec3(0.62, 0.64, 0.66) * (0.85 + 0.3 * br), 0.3 + 0.1 * br, 1.0);
    float grime = smoothstep(0.35, 0.0, p.y) * fbm(p.xz * 14.0 + p.y * 6.0, 3);
    m.alb *= 1.0 - 0.7 * grime; m.rough += grime * 0.5;
    return dirty(m, p, 0.6);
  }
  if (id == 2) {
    vec3 q = p - TERM - vec3(0.0, 1.36, -0.08);
    q.yz = rot(0.42) * q.yz;
    Mat m = M(vec3(0.03), 0.05, 0.0); m.clear = 1.0;
    // the screen: blank, glowing, scanlines; a hairline gold bezel
    float scr = step(abs(q.x), 0.29) * step(abs(q.y), 0.2) * step(0.02, q.z);
    float bez = step(abs(q.x), 0.3) * step(abs(q.y), 0.21) * (1.0 - scr) * step(0.02, q.z);
    float scan = 0.85 + 0.15 * sin(q.y * 1400.0);
    float vig = 1.0 - 0.5 * smoothstep(0.1, 0.36, length(q.xy * vec2(0.8, 1.2)));
    // the UI: pale glossy panel, a dark header strip, a gold badge with a check, five gold stars,
    // a green THANK YOU button; the blindfold bar; the APPROVED flash
    vec2 f = q.xy;
    vec3 bg = mix(vec3(0.78, 0.92, 0.85), vec3(0.35, 1.5, 0.4), uFlash);
    bg = mix(bg, vec3(0.62, 0.95, 0.66), uOk * (1.0 - uFlash) * 0.6);
    vec3 ui = bg;
    ui = mix(ui, vec3(0.06, 0.14, 0.1), step(0.15, f.y));
    float badge = length(f - vec2(-0.15, 0.0)) - 0.085;
    ui = mix(ui, vec3(1.3, 0.85, 0.3), step(badge, 0.0));
    ui = mix(ui, vec3(0.5, 0.3, 0.08), step(abs(badge + 0.006), 0.004));
    float chk = min(sdSeg(f, vec2(-0.195, 0.005), vec2(-0.162, -0.03)), sdSeg(f, vec2(-0.162, -0.03), vec2(-0.1, 0.04)));
    ui = mix(ui, vec3(0.05, 0.05, 0.04), step(chk, 0.011));
    for (int i = 0; i < 5; i++) {
      float st = sdStar5(f - vec2(-0.23 + float(i) * 0.04, -0.14), 0.016, 0.45);
      ui = mix(ui, vec3(1.3, 0.85, 0.25), step(st, 0.0));
    }
    float btn = sdRoundBox(vec3(f - vec2(0.12, -0.11), 0.0), vec3(0.13, 0.035, 1.0), 0.02);
    ui = mix(ui, vec3(0.12, 0.55, 0.22), step(btn, 0.0));
    // the blindfold: a black band sliding in from the left across the badge
    float bx = -0.29 + uBlind * 0.3;
    float band = step(abs(f.y - 0.012 - (f.x + 0.15) * 0.08), 0.028) * step(f.x, bx) * step(-0.29, f.x);
    ui = mix(ui, vec3(0.015), band);
    m.emit = scr * ui * 0.85 * uGlow * scan * vig;
    if (bez > 0.5) m = GOLD();
    return m;
  }
  if (id == 3) return cupTi((p - CP) / CS, n);
  if (id == 4) {
    // black-green poison, glossy, acid green glinting in slow swirls
    float sw = fbm(vec3((p.xz - CP.xz) * 14.0, uTime * 0.4), 3);
    Mat m = M(vec3(0.01, 0.03, 0.015), 0.04, 0.0); m.clear = 1.0;
    m.emit = vec3(0.25, 1.0, 0.2) * pow(smoothstep(0.55, 0.8, sw), 2.0) * 1.6;
    return m;
  }
  if (id == 6) return gloveMat(gloveLocal(p));
  if (id == 7) { Mat m = M(vec3(0.02, 0.1, 0.03), 0.05, 0.0); m.clear = 1.0; m.emit = vec3(0.3, 1.4, 0.25) * 1.5; return m; }
  // worn copper with a green bloom of verdigris in the relief
  float v = smoothstep(0.55, 0.8, fbm(p * 160.0, 3));
  Mat m = M(mix(vec3(0.86, 0.46, 0.3), vec3(0.3, 0.5, 0.38), v * 0.7), 0.3 + 0.35 * v, 1.0 - 0.8 * v);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('96, 116, 106', 1.3), uCycB: rgb('52, 62, 60', 0.9),
      uFloorCol: rgb('84, 92, 86', 0.9), uFloorRough: 0.07, uFloorGrain: 1.6,
      uKeyDir: [-0.3, 0.9, 0.28], uKeyCol: [3.6, 4.2, 4.2], uKeySize: 0.28,
      uRimA: [2.4, 0.9, 0.22], uRimB: [0.35, 1.4, 0.5],
      uP1: [-0.42, 1.5, 0.5], uP1c: [0.5, 1.2, 0.7],
      uP2: [1.4, 1.9, 1.2], uP2c: [2.6, 1.1, 0.3],
      uGrime: 0.8, uHaze: 0.05, uHazeCol: [0.07, 0.1, 0.085],
      uC1: [0, 9, 0, 0], uC2: [0, 9, 0, 0], uGlow: 1, uBlind: 0, uFlash: 0, uOk: 0, uGlove: [0, 9, 0, 0], uDrop: [0, 9, 0, 0],
    },
    camera,
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the glove lifts away from the chalice's rim in the first second, eased out, gone by 1.4 s
      const g = ease.inOut3((t - t0 + 0.25) / 1.4);
      u.uGlove.value = g >= 1 ? [0, 9, 0, 0] : [CP[0] - 0.02 - 0.9 * g, 1.2 + 1.6 * g, CP[2] + 0.1 + 0.3 * g, -0.25 - 0.5 * g];
      // the clink flicks one drop of green up out of the cup
      const ud = t - wPays;
      u.uDrop.value = ud < 0 || ud > 0.5 ? [0, 9, 0, 0] : [CP[0] + 0.1 + 0.25 * ud, SLOT[1] + 0.02 + 1.3 * ud - 4.9 * ud * ud, CP[2] + 0.05, 0.014 * (1 - ud)];
      u.uC1.value = coinAt(t, wPays, 1);
      u.uC2.value = coinAt(t, wPays + 0.2, -1);
      u.uBlind.value = t < wBlind ? 0 : ease.out5((t - wBlind) / 0.22);
      u.uFlash.value = t < wSmile ? 0 : Math.exp(-(t - wSmile) * 3.5);
      u.uOk.value = t < wSmile ? 0 : 1;
      // the screen hums; each coin makes it dip for a moment and come back blank
      const dip = (tt) => Math.exp(-Math.max(0, t - tt) * 6) * (t > tt ? 0.4 : 0);
      u.uGlow.value = 0.95 + 0.04 * Math.sin(t * 31) - dip(wPays) - dip(wPays + 0.2);
    },
    post(t) { return grade(t, { exposure: 1.05, vignette: 0.5 }); },
  };
};
