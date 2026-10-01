// 17 · 'You say "we see" / So your darkness stays'
// A line of glossy smart visors on thin posts stands in the dark like a product launch, their black
// mirrored lenses full of reflected city lights (amber, cyan, magenta). Behind them a faint crowd
// of silhouettes waits, guided by green navigation chevrons on the wet floor. The lights in the
// visors die one by one from "see" onward; on "darkness" the last ones and the chevrons go out and
// the visor wall is black; the frame sinks to true black for the last 12 frames (s18 opens from it).
import { grade, rgb, linesAt, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { XF_GLSL } from '/song/lib/x-f.js';

// v3: the opening camera move after the cut: a small dolly-in that eases in and settles over
// ~0.6 s (36 frames), so the shot never lands on a dead stop just after the cut
const settleIn = (cam, t, t0, amt = 0.05, dur = 0.6) => {
  const x = (t - t0) / dur;
  if (x >= 1) return cam;
  const k = 1 - ease.inOut3(Math.max(0, x));
  return { ...cam, pos: cam.pos.map((v, i) => v + (v - cam.target[i]) * amt * k) };
};

export const VISORS = [[-1.55, 0.25], [-0.95, 0.05], [-0.33, 0.2], [0.3, 0.0], [0.92, 0.18], [1.52, -0.02]];

export function rig(P) {
  const [L1, L2] = linesAt(P.from - 0.6, 'You say', 'So your darkness');
  const tSee = L1.words[L1.words.length - 1].start, tDark = L2.words.find((w) => /darkness/i.test(w.w)).start;
  const tBlack = P.to - 12 / 60;
  const camera = (t) => {
    const u = t - P.from;
    const k = ease.inOut3(u / (tDark - P.from));
    return { pos: [0.45 - 0.3 * k, 1.12 - 0.02 * k, 2.75 - 0.35 * k], target: [0.05 - 0.1 * k, 1.5, -0.4], fov: 42, roll: 0 };
  };
  return { L1, L2, tSee, tDark, tBlack, camera };
}

export default (P) => {
  const R = rig(P);
  return {
    name: 's17-we-see', from: P.from, to: P.to,
    frag: STUDIO_GLSL + XF_GLSL + /* glsl */ `
uniform float uLive[6];
uniform float uNav, uCrowd;
${VISORS.map((v, i) => `const vec3 V${i} = vec3(${v[0].toFixed(3)}, 0.0, ${v[1].toFixed(3)});`).join('\n')}
vec3 visorPos(int i) { return i == 0 ? V0 : i == 1 ? V1 : i == 2 ? V2 : i == 3 ? V3 : i == 4 ? V4 : V5; }
int gVi = 0;
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = 1e9;
  // only the two nearest visors along x
  float fi = clamp(floor((p.x + 1.55) / 0.615 + 0.5), 0.0, 5.0);
  for (int k = -1; k <= 1; k++) {
    int i = int(clamp(fi + float(k), 0.0, 5.0));
    vec3 q = p - visorPos(i);
    q.xz *= rot(0.12 * (float(i) - 2.5) * 0.3);
    float v = sdVisor(q);
    if (v < d) { d = v; gVi = i; id = visorLens(q) < 0.002 ? 2 : 1; }
  }
  // the crowd: silhouettes standing in rows far behind
  vec3 c = p - vec3(0.0, 0.0, -6.5);
  if (c.z > -1.2 && c.z < 1.0 && abs(c.x) < 6.0) {
    vec2 cell = vec2(0.55, 0.8);
    vec2 id2 = floor(c.xz / cell + 0.5);
    vec2 o = (hash22(id2 + 3.0) - 0.5) * vec2(0.25, 0.3);
    vec3 cq = c - vec3(id2.x * cell.x + o.x, 0.0, id2.y * cell.y + o.y);
    float hgt = 1.55 + 0.25 * hash12(id2);
    float body = sdRoundCone(cq, vec3(0.0, 0.1, 0.0), vec3(0.0, hgt - 0.35, 0.0), 0.12, 0.2);
    body = min(body, length(cq - vec3(0.0, hgt - 0.1, 0.0)) - 0.11);
    body = max(body, abs(cq.z) - 0.14) ;
    if (body < d) { d = body * 0.8; id = 3; }
  } else d = min(d, max(abs(c.x) - 6.0, max(-1.2 - c.z, c.z - 1.0)) + 0.1);
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 3) return M(vec3(0.006, 0.006, 0.008), 0.9, 0.0);
  if (id == 1) { Mat m = M(vec3(0.05, 0.05, 0.055), 0.2, 1.0); return m; }
  // the lens: black mirror glass full of reflected city lights, dying with uLive
  int i = gVi;
  float live = 0.0;
  for (int k = 0; k < 6; k++) if (k == i) live = uLive[k];
  vec3 q = p - visorPos(i);
  Mat m = M(vec3(0.01, 0.01, 0.012), 0.03, 0.0); m.clear = 1.0;
  vec2 uv = vec2(atan(q.x, q.z + 0.06) * 0.18, q.y - 1.45);
  vec2 g = uv * vec2(60.0, 40.0);
  vec2 cid = floor(g), f = fract(g) - 0.5;
  float h = hash12(cid + float(i) * 13.0);
  float dot1 = smoothstep(0.45, 0.15, length(f)) * step(0.8, h);
  vec3 lc = h > 0.93 ? vec3(2.6, 0.4, 1.6) : (h > 0.84 ? vec3(0.4, 1.8, 2.6) : vec3(2.8, 1.6, 0.5));
  // a skyline of lit windows along the lower part of the reflection
  float sky = step(uv.y, -0.005 + 0.02 * hash11(floor(uv.x * 50.0) + float(i)));
  float win = step(0.75, hash12(floor(vec2(uv.x * 140.0, uv.y * 160.0)) + float(i))) * sky;
  m.emit = (lc * dot1 * 0.9 + vec3(2.4, 1.7, 0.8) * win * 0.04) * live;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  // green navigation chevrons on the wet floor, pointing the crowd forward (dead, flickering)
  if (rd.y < 0.0) {
    float tf = -ro.y / rd.y;
    if (tf <= depth + 0.01) {
      vec2 xz = (ro + rd * tf).xz;
      vec2 cq = vec2(xz.x, xz.y + 1.2);
      float row = floor(cq.y / 0.55 + 0.5);
      cq.y += 2.2;
      float lane = floor(cq.x / 1.2 + 0.5);
      vec2 l = vec2(cq.x - lane * 1.2, cq.y - row * 0.55);
      float chev = abs(l.y + abs(l.x) * 0.7) ;
      float m = smoothstep(0.03, 0.012, chev) * step(abs(l.x), 0.22) * step(-2.6, cq.y) * step(cq.y, 1.2) * step(abs(lane), 2.0);
      float flick = step(0.35, hash12(vec2(row, lane) + floor(uTime * 9.0)));
      col += vec3(0.2, 1.3, 0.35) * m * uNav * (0.35 + 0.65 * flick);
    }
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('120, 64, 170', 1.5), uCycB: rgb('18, 12, 30', 1.0),
      uFloorCol: rgb('46, 46, 54', 0.9), uFloorRough: 0.3, uFloorGrain: 1.5,
      uGrime: 0.45, uHaze: 0.07, uHazeCol: [0.09, 0.05, 0.14],
      uKeyDir: [-0.3, 0.8, 0.55], uKeyCol: [1.8, 1.8, 2.1], uKeySize: 0.35,
      uRimA: [3.0, 1.2, 4.2], uRimB: [1.0, 3.4, 1.6],
      uP1: [0.0, 2.2, 1.6], uP1c: [0.5, 0.5, 0.7],
      uLive: [1, 1, 1, 1, 1, 1], uNav: 1, uCrowd: 1,
    },
    camera: (t) => settleIn(R.camera(t), t, P.from),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // the lights die one by one from "see", the last on "darkness"
      const order = [2, 5, 0, 3, 1, 4];
      const live = [1, 1, 1, 1, 1, 1];
      order.forEach((vi, j) => {
        const td = j < 5 ? R.tSee + 0.05 + j * ((R.tDark - R.tSee - 0.1) / 5) : R.tDark;
        const x = (t - td) / 0.12;
        live[vi] = x < 0 ? 1 : x > 1 ? 0 : (1 - x) * (Math.floor(x * 8) % 2 ? 0.3 : 1);
      });
      u.uLive.value = live;
      u.uNav.value = 1 - clamp01((t - R.tDark) / 0.15);
      // after "darkness" the whole frame sinks; true black for the last 12 frames
      const sink = ease.inOut3((t - R.tDark) / (R.tBlack - R.tDark));
      u.uExpo.value = t >= R.tBlack ? 0 : 1 - 0.85 * sink;
      u.uP1c.value = [0.5, 0.5, 0.7].map((c) => c * (1 - sink));
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.5, ...(t >= R.tBlack ? { lift: [0, 0, 0], grain: 0, bloom: 0 } : {}) }); },
  };
};
