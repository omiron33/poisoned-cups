// 14 · "You kiss the scrolls / But your tongues call God a liar"
// Outside: a Scripture scroll feeding over a glass lectern and spilling to the wet concrete floor,
// columns of script crawling toward us, a red wax seal. On "kiss" a lipstick kiss-print presses onto
// the seal (the pious kiss). Inside: that print is the mouth. On "tongues" its lips part and a forked
// viper tongue flicks out over the scroll; on "liar" it lashes again, stamps FALSE across the
// lettering (the lyric layer) and the seal cracks under the stamp.
import { ease, grade, rgb, orbit, linesFrom, spring, clamp01 } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('You kiss the scrolls', 'But your tongues');
const W = (L, k) => L.words.find((w) => w.w.toLowerCase().replace(/[^a-z]/g, '').startsWith(k));

export default (P) => {
  const t0 = P.from;
  const camera = (t) => {
    const u = t - t0;
    return orbit(t, { target: [0.1, 1.06, 0.06], yaw: 0.26 - 0.035 * u, pitch: 0.26 + 0.012 * u, dist: 1.95 - 0.06 * u, fov: 38, drift: 0.006 });
  };
  const tKiss = W(L1, 'kiss').start, tSnake = W(L2, 'but').start, tTongue = W(L2, 'tongues').start, tLiar = W(L2, 'liar').start;
  return {
    name: 's14-scrolls', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uScroll, uSnake, uTongue, uKiss, uSeal;
const vec3 SC = vec3(0.0, 1.05, 0.0);
const vec3 AY = vec3(0.0, 0.5646, -0.8253);
const vec3 AN = vec3(0.0, 0.8253, 0.5646);
vec3 loc(vec3 p) { vec3 d = p - SC; return vec3(d.x, dot(d, AY), dot(d, AN)); }
float sdSheet(vec3 p) {
  vec2 q = vec2(p.z, p.y);
  float d = sdSeg(q, vec2(-0.454, 1.3605), vec2(0.454, 0.7395));
  d = min(d, sdSeg(q, vec2(0.454, 0.7395), vec2(0.53, 0.62)));
  d = min(d, sdSeg(q, vec2(0.53, 0.62), vec2(0.545, 0.06)));
  d = min(d, sdSeg(q, vec2(0.545, 0.06), vec2(0.63, 0.012)));
  d = min(d, sdSeg(q, vec2(0.63, 0.012), vec2(1.4, 0.012)));
  d -= 0.003;
  vec2 w = vec2(d, abs(p.x) - 0.42);
  return length(max(w, 0.0)) + min(max(w.x, w.y), 0.0);
}
// the tongue comes out of the kiss-print's lips on the seal
float sdTongue(vec3 q) {
  float L = 0.3 * uTongue;
  vec3 T = vec3(0.27, -0.365, 0.016);
  vec3 F = T + vec3(-0.35, 1.0, 0.04) * L / 1.06;
  float tg = sdCapsule(q, T, F, 0.0065);
  float pr = 0.07 * uTongue;
  tg = min(tg, sdCapsule(q, F, F + vec3(-0.03 * uTongue, pr, 0.0), 0.0045));
  tg = min(tg, sdCapsule(q, F, F + vec3(0.03 * uTongue, pr, 0.0), 0.0045));
  return tg;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  float bnd = sdBox(p - vec3(0.6, 0.75, 0.4), vec3(1.4, 0.8, 1.1));
  if (bnd > 0.2) return bnd;
  float d = sdSheet(p);
  vec3 q = loc(p);
  // glass lectern under the sloped sheet
  float g = sdRoundBox(p - vec3(0.0, 0.7, 0.0), vec3(0.5, 0.7, 0.47), 0.025);
  g = max(g, q.z + 0.008);
  if (g < d) { d = g; id = 2; }
  // the feed roll at the top, with gold caps
  vec3 rq = q - vec3(0.0, 0.57, 0.05);
  float r = length(rq.yz) - 0.06;
  r = max(r, abs(rq.x) - 0.45);
  if (r < d) { d = r; id = 3; }
  float cap = max(length(rq.yz) - 0.075, abs(abs(rq.x) - 0.47) - 0.022);
  if (cap < d) { d = cap; id = 4; }
  // wax seal
  vec3 sq = q - vec3(0.27, -0.36, 0.006);
  float s = sdCoin(sq.xzy, 0.06, 0.009, 3.0);
  if (s < d) { d = s; id = 5; }
  // acid-green LED strip under the front edge
  float led = sdRoundBox(q - vec3(0.0, -0.56, -0.03), vec3(0.47, 0.006, 0.006), 0.004);
  if (led < d) { d = led; id = 8; }
  if (uTongue > 0.01) {
    float tg = sdTongue(q);
    if (tg < d) { d = tg; id = 7; }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  vec3 q = loc(p);
  if (id == 1) {
    // parchment with columns of script crawling down toward us
    float v = q.y + uScroll;
    float row = fract(v * 30.0);
    float ln = smoothstep(0.2, 0.3, row) * smoothstep(0.6, 0.5, row);
    float rid = floor(v * 30.0);
    float col = step(abs(abs(q.x) - 0.2), 0.16);
    float gl = step(0.35, hash12(vec2(floor(q.x * 70.0), rid))) * step(0.12, fract(q.x * 70.0));
    float ink = ln * gl * col * step(0.1, hash11(rid * 1.7));
    vec3 a = vec3(0.78, 0.66, 0.46) * (0.88 + 0.12 * fbm(p.xz * 12.0, 3));
    a = mix(a, vec3(0.2, 0.12, 0.07), ink * 0.6);
    a *= 1.0 - 0.4 * smoothstep(0.3, 0.42, abs(q.x)) * fbm(p.xy * 9.0, 3);
    Mat m = M(a, 0.65, 0.0); m.sheen = 0.3;
    return dirty(m, p, 0.15);
  }
  if (id == 2) {
    Mat m = GLASS(vec3(0.5, 0.75, 0.68));
    vec3 dd = vec3(0.5, 0.7, 0.47) - abs(p - vec3(0.0, 0.7, 0.0));
    float ex = step(dd.x, 0.03) + step(dd.y, 0.03) + step(dd.z, 0.03);
    m.emit = vec3(0.25, 1.6, 0.3) * step(1.5, ex);
    return m;
  }
  if (id == 3) { Mat m = LACQUER(vec3(0.02, 0.025, 0.025)); m.rough = 0.2; return m; }
  if (id == 4) return GOLD();
  if (id == 5) {
    Mat m = LACQUER(vec3(0.32, 0.015, 0.02)); m.rough = 0.3 + 0.2 * vnoise(p * 90.0);
    vec2 s = (q.xy - vec2(0.27, -0.36)) / 0.06;
    // the kiss-print: two lip shapes pressed into the wax, glossier and brighter red
    vec2 u = s * vec2(1.0, 1.9);
    float up = length(vec2(u.x, u.y - 0.28 - 0.12 * abs(u.x) + 0.15 * exp(-u.x * u.x * 30.0))) - 0.55;
    float lo = length(vec2(u.x * 0.95, u.y + 0.3)) - 0.52;
    // the lips part when the tongue comes out
    float gap = abs(u.y + 0.02 + 0.03 * cos(u.x * 3.0));
    float lip = smoothstep(0.04, -0.02, min(up, lo)) * step(0.02 + 0.2 * uTongue, gap);
    float mouth = smoothstep(0.04, -0.02, min(up, lo)) * (1.0 - step(0.02 + 0.2 * uTongue, gap)) * step(0.05, uTongue) * uKiss;
    m.alb = mix(m.alb, vec3(0.01, 0.0, 0.0), mouth);
    lip *= uKiss;
    m.alb = mix(m.alb, vec3(0.62, 0.02, 0.06), lip);
    m.rough = mix(m.rough, 0.12, lip);
    // the seal cracks on "liar"
    float e = voronoiEdge(s * 2.2 + 1.0).x;
    float cr = smoothstep(0.08, 0.02, e) * uSeal * step(length(s), 0.95);
    m.alb = mix(m.alb, vec3(0.01), cr);
    return m;
  }
  if (id == 8) { Mat m = M(vec3(0.1), 0.3, 0.0); m.emit = vec3(0.6, 3.2, 0.5); return m; }
  if (id == 7) { Mat m = M(vec3(0.35, 0.02, 0.04), 0.25, 0.0); m.clear = 0.8; return m; }
  // black chrome scales
  vec2 sc = vec2(q.x * 60.0, (q.y + q.z) * 60.0);
  sc.x += 0.5 * mod(floor(sc.y), 2.0);
  float e = length(fract(sc) - 0.5);
  Mat m = M(vec3(0.14, 0.16, 0.15), 0.1 + 0.25 * smoothstep(0.3, 0.5, e), 1.0);
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('96, 128, 116', 1.0), uCycB: rgb('40, 58, 54', 0.8),
      uFloorCol: rgb('70, 84, 78', 1.0), uFloorRough: 0.08, uFloorGrain: 1.6,
      uGrime: 0.8, uHaze: 0.07, uHazeCol: [0.07, 0.1, 0.085],
      uKeyDir: [0.25, 0.9, 0.45], uKeyCol: [2.7, 3.0, 3.2], uKeySize: 0.45,
      uRimA: [0.5, 2.2, 0.4], uRimB: [2.4, 1.0, 0.25],
      uP1: [0, 0.6, 0.9], uP1c: [0.15, 0.9, 0.12],
      uScroll: 0, uSnake: 0, uTongue: 0, uKiss: 0, uSeal: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uScroll.value = 0.22 * (t - t0);
      u.uSnake.value = spring(t, tSnake - 0.15, 0.7, 0.15);
      u.uKiss.value = spring(t, tKiss, 0.3, 0.1);
      u.uSeal.value = spring(t, tLiar, 0.25, 0.1);
      const flick = (a) => { const x = (t - a) / 0.42; return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) * (0.75 + 0.25 * Math.sin(x * 40)); };
      u.uTongue.value = Math.max(flick(tTongue), flick(tLiar - 0.12), 0.6 * flick(tTongue + 0.45));
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.5 }); },
  };
};
