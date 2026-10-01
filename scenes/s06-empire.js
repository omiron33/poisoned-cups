// 06 · "You twist the truth / To build your little empire"   (v4 REBUILD)
// Outside: close on one glass post card hovering in the dark wet control hall. Its body types
// "The model isn't safe." (canvas, drawPost on the card face), and on "twist" one word flips:
// "The model is safe." On "truth" it publishes (flash, silver mark, counters spin up). Agent
// accounts repost it: a fanned grid of copies springs up behind it, three nearer ones carrying
// readable lies. Inside: on "To" every card tips flat and flies up; they rain back down as the
// eight x-empire towers (skinned with empireMatPost), one storey per word, and on "little" a fast
// pull-back shows the skyline standing on a phone lying face-up on the wet concrete. On "empire"
// the original card crowns the tallest tower, a big silver verified mark turning above it.
import { ease, grade, rgb, orbit, spring, linesFrom, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { EMPIRE_GLSL, empireUniforms, TOWERS, SH } from '/song/lib/x-empire.js';
import { POST_GLSL, POST_UNIFORMS } from '/song/lib/x-v4-post.js';

const [L1, L2] = linesFrom('You twist the truth', 'To build your little empire');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
const W_ = (L, re) => L.words.find((w) => re.test(w.w));

// the measured beats of the scene
export const T = (() => {
  const you = L1.words[0].start, tw = W_(L1, /twist/i).start, truth = W_(L1, /truth/i);
  const b0 = L2.words[0].start, build = W_(L2, /build/i).start, your = W_(L2, /your/i).start;
  const little = W_(L2, /little/i).start, emp = W_(L2, /empire/i).start;
  return { you, tw, truth: truth.start, truthEnd: truth.end, b0, build, your, little, emp };
})();

// world layout
export const PH = 0.12;                                   // phone top (towers stand on it)
export const PHONE = [2.05, PH / 2, 1.0];                 // phone half size (landscape, face up)
export const HERO = { c: [0.32, 0.56, 1.75], hs: [0.45, 0.25] };
export const CROWN_S = 0.62;                              // the hero card's scale on the crown
const TOP0 = PH + TOWERS[0][4] * SH;                      // tallest tower's roof
export const GRID = { z: 1.12, cx: 0.5, cy: 0.33, y0: 0.22, cols: 5, rows: 3, hs: [0.2, 0.111] };
// three nearer copies that carry readable lies: centre and scale (canvas posts sit on them)
export const LIES = [
  { c: [-0.66, 0.36, 1.42], s: 0.5, at: 0.06 },
  { c: [-0.72, 0.8, 1.36], s: 0.5, at: 0.2 },
  { c: [1.34, 0.4, 1.3], s: 0.5, at: 0.34 },
];

// the reposts fly: a shared lift for everything that tips and flies up on "To"
export function flyOff(t) {
  const u = Math.max(0, t - T.b0);
  return [0, 1.0 * u + 5.0 * u * u, -5.0 * u - 4.0 * u * u];
}
const tipOf = (t, d) => ease.inOut3((t - T.b0 - d) / 0.22) * Math.PI / 2;

// the hero card: centre, scale, tip (about x, + = face turns up), yaw. Pure function of t.
export function heroXf(t) {
  const crownC = [0.0, TOP0 + HERO.hs[1] * CROWN_S + 0.012, 0.08];
  if (t < T.little + 0.25) {
    const f = flyOff(t);
    return { c: [HERO.c[0] + f[0], HERO.c[1] + f[1], HERO.c[2] + f[2]], s: t > T.b0 + 0.3 ? 0 : 1, tip: tipOf(t, 0.0), yaw: 0 };
  }
  // drops back out of the sky and stands upright on the tallest tower, landing on "empire"
  const k = clamp01((t - (T.emp - 0.34)) / 0.34);
  const drop = (1 - k) * (1 - k) * 0.3;
  const wob = t > T.emp ? 0.02 * Math.exp(-(t - T.emp) * 9) * Math.sin((t - T.emp) * 34) : 0;
  return { c: [crownC[0], crownC[1] + drop, crownC[2]], s: t < T.emp - 0.34 ? 0 : CROWN_S * Math.max(0.02, ease.out3(k)), tip: (1 - ease.out3(k)) * 1.2 + wob * 4, yaw: 0.2 };
}
// rotate a local vector by tip (about x) then yaw (about y)
export function rot(v, tip, yaw) {
  const c = Math.cos(tip), s = Math.sin(tip);
  const a = [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  return [a[0] * cy + a[2] * sy, a[1], -a[0] * sy + a[2] * cy];
}

// tower heights: rain from "To", then one storey per word (snap), full on "little"
function towerLv(t) {
  const v = new Array(32).fill(0);
  const steps = [[T.build, 0.62], [T.your, 0.82], [T.little, 1.0]];
  TOWERS.forEach((tw, k) => {
    const N = tw[4];
    const d = 0.05 + 0.035 * k;
    let f = 0.42 * ease.out3((t - T.b0 - d) / 0.3);
    let prev = 0.42;
    for (const [ts, lv] of steps) { f += (lv - prev) * ease.out3((t - ts) / 0.12); prev = lv; }
    v[k * 4 + 1] = PH;
    v[k * 4 + 3] = Math.min(N, f * N);
  });
  return v;
}

// the camera: a param set blended through eased / sprung keys
function blend(a, b, s) { const o = {}; for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((x, i) => x + (b[k][i] - x) * s) : a[k] + (b[k] - a[k]) * s; return o; }
export function camera(t) {
  const u = t - T.you;
  let c = { target: [0.12 - 0.02 * u, 0.56, HERO.c[2]], yaw: 0.16 - 0.035 * u, pitch: 0.03, dist: 1.5 - 0.05 * u, fov: 36 };
  // the reposts fill in behind: a slow rise and step back
  c = blend(c, { target: [0.12, 0.66, 1.6], yaw: 0.1, pitch: 0.1, dist: 2.25, fov: 36 }, ease.inOut3((t - (T.truthEnd - 0.05)) / 0.75));
  // "To": crane up and back with the flying cards
  c = blend(c, { target: [0.0, 0.5, 0.15], yaw: 0.26, pitch: 0.2, dist: 2.7, fov: 36 }, ease.inOut3((t - (T.b0 - 0.05)) / 0.4));
  // one storey per word: hold, snap, spring
  c = blend(c, { target: [0.0, 0.62, 0.1], yaw: 0.24, pitch: 0.24, dist: 2.95, fov: 36 }, spring(t, T.build - 0.04, 0.4, 0.25));
  c = blend(c, { target: [0.0, 0.74, 0.05], yaw: 0.22, pitch: 0.28, dist: 3.2, fov: 36 }, spring(t, T.your - 0.04, 0.4, 0.25));
  // "little": the fast pull-back (8-frame ease in, spring settle) shows the phone
  const lk = t < T.little ? 0 : (t < T.little + 0.133 ? 0.35 * Math.pow(Math.min(1, Math.max(0, (t - T.little) / 0.133)), 3) : 0.35 + 0.65 * spring(t, T.little + 0.133, 0.45, 0.18));
  c = blend(c, { target: [0.0, 0.3, 0.1], yaw: 0.22, pitch: 0.74, dist: 5.6, fov: 36 }, lk);
  // "empire": a small spring punch toward the crown, then drift
  c = blend(c, { target: [0.0, 1.0, 0.1], yaw: 0.22, pitch: 0.6, dist: 4.7, fov: 36 }, spring(t, T.emp - 0.03, 0.4, 0.3));
  c.yaw += t > T.emp ? -0.02 * (t - T.emp) : 0;
  return orbit(t, { ...c, drift: 0.006 });
}

export default (P) => ({
  name: 's06-empire', from: P.from, to: P.to,
  frag: STUDIO_GLSL + EMPIRE_GLSL + POST_GLSL + /* glsl */ `
uniform vec3 uHeroC; uniform vec4 uHeroX;      // centre; (scale, tip, yaw, lit)
uniform vec4 uLie[3];                           // centre xyz, scale (0 = hidden)
uniform vec3 uFly; uniform float uFlyT, uGridT, uGridOn, uRipple, uTear, uBeacon, uPhone, uFeed;
const vec2 HHS = vec2(${HERO.hs[0].toFixed(3)}, ${HERO.hs[1].toFixed(3)});
const vec3 PHH = vec3(${PHONE.map((x) => x.toFixed(3)).join(', ')});

vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y + s * p.z, -s * p.y + c * p.z); }
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }
// world -> hero card local (inverse of yaw then tip)
vec3 heroLocal(vec3 p) { return rotX(rotY(p - uHeroC, uHeroX.z), uHeroX.y); }

// the phone lying face up: rounded slab, titanium rim, black glass screen with a faint feed
float sdPhone(vec3 p) {
  vec3 q = p - vec3(0.0, PHH.y, 0.0);
  vec2 d2 = abs(q.xz) - (PHH.xz - 0.34);
  float r2 = length(max(d2, 0.0)) + min(max(d2.x, d2.y), 0.0) - 0.34;
  vec2 w = vec2(r2 + 0.035, abs(q.y) - PHH.y + 0.035);
  float d = length(max(w, 0.0)) + min(max(w.x, w.y), 0.0) - 0.035;
  // side buttons on the long +z rim
  d = min(d, sdRoundBox(q - vec3(0.55, 0.0, PHH.z), vec3(0.22, 0.018, 0.014), 0.01));
  d = min(d, sdRoundBox(q - vec3(-0.15, 0.0, PHH.z), vec3(0.12, 0.018, 0.014), 0.01));
  return d;
}
Mat phoneMat(vec3 p, vec3 n) {
  vec3 q = p - vec3(0.0, PHH.y, 0.0);
  if (n.y > 0.8 && q.y > PHH.y - 0.01) {
    vec2 d2 = abs(q.xz) - (PHH.xz - 0.34);
    float r2 = length(max(d2, 0.0)) + min(max(d2.x, d2.y), 0.0) - 0.34;
    Mat m = M(vec3(0.006, 0.007, 0.01), 0.03, 0.0); m.clear = 1.0;
    if (r2 < -0.06) {
      // the island: a black pill at the top end of the screen (landscape: the -x end)
      float isl = length(max(abs(q.xz - vec2(-PHH.x + 0.2, 0.0)) - vec2(0.0, 0.16), 0.0)) - 0.045;
      // the feed: one post per row, rows stacked down the screen, scrolling
      float rowH = 0.3;
      float y = q.z + PHH.z - 0.08 + uTime * 0.05;
      float ri = floor(y / rowH);
      vec2 uv = vec2((q.x + PHH.x - 0.12) / (2.0 * PHH.x - 0.24), 1.0 - fract(y / rowH));
      float asp = (2.0 * PHH.x - 0.24) / rowH;
      vec3 e = postSkinA(uv, asp, ri * 7.31 + 3.0, 1.0);
      // brighter round the towers' feet, dim elsewhere
      float foot = smoothstep(1.4, 0.2, length(q.xz * vec2(0.8, 1.2)));
      m.emit = e * uFeed * (0.35 + 0.9 * foot) * step(0.0, isl);
    }
    return m;
  }
  Mat m = M(vec3(0.8, 0.8, 0.84), 0.12, 1.0);   // titanium rim
  return dirty(m, p * 2.0, 0.15);
}

// our verified mark as a big silver beacon: a hexagonal plate with a chevron cut through it
float chev2(vec2 p, float r) {
  float a = sdSeg(p, vec2(-0.42, 0.02) * r, vec2(-0.1, -0.3) * r);
  float b = sdSeg(p, vec2(-0.1, -0.3) * r, vec2(0.45, 0.3) * r);
  return min(a, b) - 0.11 * r;
}
float sdBeacon(vec3 p) {
  vec3 q = p - vec3(0.0, ${(TOP0 + 2 * HERO.hs[1] * CROWN_S + 0.24).toFixed(3)}, 0.08);
  if (length(q) > 0.3) return length(q) - 0.25;
  q = rotY(q, uTime * 1.3);
  float r = 0.17 * uBeacon;
  vec2 h = abs(q.xy);
  float hex = max(h.x * 0.866 + h.y * 0.5, h.y) - r;
  float d = max(hex, abs(q.z) - 0.018 * uBeacon);
  d = max(d, -max(chev2(vec2(q.x, -q.y), r), abs(q.z) - 0.03));
  return d;
}

float mapObj(vec3 p, out int id) {
  float d = empireSDF(p, id);
  float ph = sdPhone(p);
  if (ph < d) { d = ph; id = 40; }
  // the hero card
  if (uHeroX.x > 0.001) {
    float h = postCardSDF(heroLocal(p) / uHeroX.x, HHS) * uHeroX.x;
    if (h < d) { d = h; id = 60; }
  }
  // the agent reposts: a fanned grid behind the hero (one cell evaluated)
  if (uGridOn > 0.5) {
    vec3 g = p - vec3(0.0, ${GRID.y0.toFixed(3)}, ${GRID.z.toFixed(3)}) - uFly;
    float bb = sdBox(g - vec3(0.0, ${(GRID.cy).toFixed(3)}, 0.0), vec3(${(GRID.cx * 2.6).toFixed(3)}, ${(GRID.cy * 1.7).toFixed(3)}, 0.25));
    if (bb < d) {
      if (bb > 0.05) d = min(d, bb + 0.0);
      else {
        vec2 cell = vec2(clamp(floor(g.x / ${GRID.cx.toFixed(3)} + 0.5), -2.0, 2.0), clamp(floor(g.y / ${GRID.cy.toFixed(3)} + 0.5), 0.0, 2.0));
        vec3 l = g - vec3(cell * vec2(${GRID.cx.toFixed(3)}, ${GRID.cy.toFixed(3)}), -0.12 * abs(cell.x));
        float hs = hash12(cell + 3.7);
        float u = uGridT - hs * 0.6;
        float sc = u <= 0.0 ? 0.0 : 1.0 - exp(-u * 9.0) * cos(u * 14.0);
        float tip = clamp((uFlyT - hs * 0.12) / 0.22, 0.0, 1.0) * 1.5708;
        l = rotY(l, cell.x * 0.16);
        l = rotX(l, tip);
        if (sc > 0.01) {
          float c = postCardSDF(l / sc, vec2(${GRID.hs[0]}, ${GRID.hs[1]})) * sc;
          if (c < d) { d = c; id = 70 + int(cell.x + 2.0) + 5 * int(cell.y); }
        }
      }
    }
  }
  // three nearer copies carrying readable lies (posts drawn on them in the canvas layer)
  for (int i = 0; i < 3; i++) {
    vec4 L = uLie[i];
    if (L.w < 0.001) continue;
    vec3 l = p - L.xyz - uFly;
    l = rotX(l, clamp((uFlyT - 0.03 * float(i)) / 0.22, 0.0, 1.0) * 1.5708);
    float c = postCardSDF(l / L.w, HHS) * L.w;
    if (c < d) { d = c; id = 90 + i; }
  }
  if (uBeacon > 0.01) {
    float b = sdBeacon(p);
    if (b < d) { d = b; id = 95; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 40) return phoneMat(p, n);
  if (id == 60) {
    vec3 q = heroLocal(p) / uHeroX.x;
    vec3 ln = rotX(rotY(n, uHeroX.z), uHeroX.y);
    Mat m = postCardMat(q, ln, HHS, -1.0, uHeroX.w);
    // the glass ripples once with the twist
    float rp = uRipple * smoothstep(0.05, 0.0, abs(length(q.xy - vec2(-0.05, -0.02)) - (1.0 - uRipple) * 0.7));
    if (ln.z > 0.6) m.emit += vec3(0.5, 0.9, 0.6) * rp * 0.6;
    return m;
  }
  if (id >= 70 && id < 90) {
    float k = float(id - 70);
    vec3 g = p - vec3(0.0, ${GRID.y0.toFixed(3)}, ${GRID.z.toFixed(3)}) - uFly;
    vec2 cell = vec2(mod(k, 5.0) - 2.0, floor(k / 5.0));
    vec3 l = g - vec3(cell * vec2(${GRID.cx.toFixed(3)}, ${GRID.cy.toFixed(3)}), -0.12 * abs(cell.x));
    float hs = hash12(cell + 3.7);
    float u = uGridT - hs * 0.6;
    float sc = max(1.0 - exp(-u * 9.0) * cos(u * 14.0), 0.05);
    float tip = clamp((uFlyT - hs * 0.12) / 0.22, 0.0, 1.0) * 1.5708;
    l = rotX(rotY(l, cell.x * 0.16), tip);
    vec3 ln = rotX(rotY(n, cell.x * 0.16), tip);
    float pub = 1.0 + 0.6 * exp(-max(u, 0.0) * 7.0);
    return postCardMat(l / sc, ln, vec2(${GRID.hs[0]}, ${GRID.hs[1]}), k * 1.7 + 2.0, pub);
  }
  if (id >= 90 && id < 95) {
    int i = id - 90;
    vec4 L = uLie[0]; if (i == 1) L = uLie[1]; if (i == 2) L = uLie[2];
    float tip = clamp((uFlyT - 0.03 * float(i)) / 0.22, 0.0, 1.0) * 1.5708;
    vec3 l = rotX(p - L.xyz - uFly, tip);
    vec3 ln = rotX(n, tip);
    return postCardMat(l / L.w, ln, HHS, -1.0, 1.0);
  }
  if (id == 95) {
    Mat m = SILVER(); m.rough = 0.12;
    m.emit = vec3(0.55, 0.58, 0.66) * 0.5 * uBeacon;
    return m;
  }
  return empireMatPost(id, p, n);
}
// the v4 glitch: macroblock slips (16 to 32 px blocks sliding) for a few frames
vec2 blockSlip(vec2 fc, float amt) {
  if (amt <= 0.001) return fc;
  float bs = uRes.y / 34.0;
  vec2 b = floor(fc / vec2(bs * 2.0, bs));
  float f = floor(uTime * 60.0);
  float h = hash12(b + f * 0.37);
  float band = step(0.6, hash12(vec2(b.y, f)));
  return fc + band * step(1.0 - 0.55 * amt, h) * vec2((hash12(b + 9.1 + f) - 0.5) * bs * 6.0, 0.0);
}
vec3 shade(vec2 fc) {
  fc = blockSlip(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
  uniforms: {
    ...STUDIO_UNIFORMS,
    uCycA: rgb('62, 42, 96', 1.0), uCycB: rgb('16, 12, 28', 1.0),
    uFloorCol: rgb('46, 44, 56', 0.7), uFloorRough: 0.1, uGrime: 0.9,
    uKeyDir: [-0.3, 1.0, 0.45], uKeyCol: [1.6, 1.7, 2.1], uKeySize: 0.35,
    uRimA: [2.0, 2.1, 2.4], uRimB: [0.45, 2.0, 0.7],
    uHaze: 0.045, uHazeCol: [0.06, 0.045, 0.1],
    ...empireUniforms(), uFibLo: -1.0, uFibHi: -1.0, uFibFollow: 1, uBoundX: 1.2,
    ...POST_UNIFORMS,
    uHeroC: HERO.c, uHeroX: [1, 0, 0, 1],
    uLie: new Array(12).fill(0),
    uFly: [0, 0, 0], uFlyT: 0, uGridT: 0, uGridOn: 0, uRipple: 0, uTear: 0, uBeacon: 0, uPhone: 1, uFeed: 0.3,
  },
  camera,
  textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
  update(t, u) {
    const v = towerLv(t);
    const arr = u.uLv.value; for (let i = 0; i < 32; i++) arr[i] = v[i];
    const h = heroXf(t);
    const pub = t >= T.truth ? 1 + 0.8 * Math.exp(-(t - T.truth) * 6) : 1;
    setV(u, 'uHeroC', h.c);
    setV(u, 'uHeroX', [h.s, h.tip, h.yaw, pub]);
    const fly = flyOff(t);
    setV(u, 'uFly', fly);
    u.uFlyT.value = Math.max(0, t - T.b0);
    u.uGridT.value = Math.max(0, t - T.truthEnd);
    u.uGridOn.value = t > T.truthEnd && t < T.b0 + 0.3 ? 1 : 0;
    const lie = u.uLie.value;
    LIES.forEach((L, i) => {
      const uu = t - (T.truthEnd + L.at);
      const sc = uu <= 0 || t > T.b0 + 0.3 ? 0 : L.s * (1 - Math.exp(-uu * 9) * Math.cos(uu * 14));
      lie[i * 4] = L.c[0]; lie[i * 4 + 1] = L.c[1]; lie[i * 4 + 2] = L.c[2]; lie[i * 4 + 3] = Math.max(0, sc);
    });
    u.uRipple.value = t > T.tw ? clamp01((t - T.tw) / 0.35) * (t < T.tw + 0.35 ? 1 : 0) : 0;
    u.uTear.value = t >= T.emp && t < T.emp + 0.05 ? 1 : 0;
    u.uBeacon.value = spring(t, T.emp, 0.5, 0.3);
    u.uFeed.value = 0.3 + 1.1 * ease.inOut3((t - T.little) / 0.4);
    u.uPostLit.value = 1;
    u.uGlow.value = 1;
    // a cold light on the card while it is close, then the beacon's silver light above the crown
    const crownY = TOP0 + 0.6;
    setV(u, 'uP1', [0.3, 1.1, 2.6]);
    setV(u, 'uP1c', t < T.b0 + 0.3 ? [0.7, 0.75, 1.0] : [0.2, 0.22, 0.3]);
    setV(u, 'uP2', [0.0, crownY, 0.3]);
    const bl = u.uBeacon.value;
    setV(u, 'uP2c', [1.4 * bl, 1.45 * bl, 1.8 * bl]);
  },
  post(t) { return grade(t, { exposure: 1.05, bloom: 0.1, threshold: 1.1 }); },
});
