// 18 · 'You say "we're clean" / But your hands still raise' (v2)
// Out of s17's blackout the camera pulls back into a sterile white clean room: epoxy floor, cold
// tube light, a white bench, a wide silver basin of purified water with the black titanium chalice
// standing in it, two sensor poles with scanning light rings and a compliance scanner ring hovering
// over the cup. On "clean" the scanner ring sweeps down the cup in a cold flash (the system
// certifies itself). On "But" the camera snaps in over the basin and contamination blooms green-black
// through the water from the cup's foot; fingerprints surface glowing on the white bench and green
// transaction trails run along it to the back. Two industrial robot arms stand behind the bench
// (graphite links, pale joint housings, clamp tool heads with a green status ring), idling low with
// a silver payout tray held out of sight below the bench line; on "raise" they lift the tray up
// into frame above the cup (s19 opens with tokens pouring into it). No hands, no fingers.
import { grade, rgb, ease, clamp, linesAt, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { HALL_GLSL } from '/song/lib/x-a.js';

export const lines18 = (P) => linesAt(P.from - 0.6, 'You say', 'But your hands still raise');
export const BENCH = 0.5;

export default (P) => {
  const [L1, L2] = lines18(P);
  const tBut = L2.words[0].start;
  const tClean = L1.words.find((w) => /clean/i.test(w.w)).start;
  const tRaise = L2.words.find((w) => /raise/i.test(w.w))?.start ?? L2.end;
  const camera = (t) => {
    const u = t - P.from;
    let pos, target, fov;
    if (t < tBut - 0.02) {
      // pull back out of the dark, level with the bench, drifting
      const k = ease.out3(clamp(u / 1.6, 0, 1));
      const dist = 1.2 + 2.9 * k + 0.08 * u;
      const yaw = 0.25 - 0.12 * k;
      target = [0, BENCH + 0.42, 0];
      pos = [Math.sin(yaw) * dist, BENCH + 0.55 + 0.35 * k, Math.cos(yaw) * dist];
      fov = 36;
    } else {
      // the snap: in and above the basin, easing back as the arms lift the tray behind it
      const v = t - tBut;
      const s = spring(t, tBut, 0.35, 0.2);
      const r = ease.inOut3(clamp((t - tRaise + 0.3) / 0.9, 0, 1));
      target = [0, BENCH + 0.25 + 0.3 * r, -0.15];
      const dist = 2.6 - 0.1 * v - 0.35 * (1 - s) + 0.5 * r;
      const pitch = 0.62 - 0.03 * v - 0.3 * r;
      const yaw = -0.3 + 0.04 * v;
      pos = [target[0] + Math.sin(yaw) * Math.cos(pitch) * dist, target[1] + Math.sin(pitch) * dist, target[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
      fov = 38;
    }
    return { pos, target, fov, roll: 0 };
  };
  return {
    name: 's18-clean', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + CUP_GLSL + HALL_GLSL + /* glsl */ `
uniform float uCloud, uRise, uScanY, uScanOn, uPrints;
const float BY = ${BENCH.toFixed(3)};
const float CS = 0.55;        // chalice scale
const vec2 BAS = vec2(0.72, 0.24);
float basinEll(vec3 p) { vec2 q = vec2(length(p.xz), p.y - (BY + BAS.y)); vec2 d = q / BAS; return (length(d) - 1.0) * BAS.y * (0.8 + 0.2 * length(d)); }
float WL() { return BY + BAS.y - 0.04; }
// two industrial arms (mirrored in x) holding a silver payout tray between their tool heads
float trayY() { return BY - 0.3 + 1.1 * uRise; }
const vec3 ARM_S = vec3(1.25, 0.95, -1.1);   // shoulder (right arm; the left is its mirror)
const float ARM_L = 0.56;                    // each link
vec3 armTip() { return vec3(0.66, trayY() + 0.02, -0.95); }
vec3 armElbow() {
  vec3 d = armTip() - ARM_S;
  float L = length(d); vec3 dir = d / L;
  float a = acos(clamp(L / (2.0 * ARM_L), 0.0, 1.0));
  vec3 bend = normalize(vec3(0, 1, 0) - dir * dir.y + vec3(0.0, 0.0, -0.001));
  return ARM_S + ARM_L * (dir * cos(a) + bend * sin(a));
}
float arms(vec3 p, out float part) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  part = 0.0;
  float b = length(q - vec3(1.0, 0.8, -1.05)) - 1.1;
  if (b > 0.1) return b;
  vec3 E = armElbow(), T = armTip();
  float base = sdCyl(q - vec3(ARM_S.x, 0.45, ARM_S.z), 0.13, 0.45) - 0.01;
  float links = min(sdCapsule(q, ARM_S, E, 0.05), sdCapsule(q, E, T + vec3(0.09, 0.0, 0.0), 0.04));
  float joints = min(length(q - ARM_S) - 0.085, length(q - E) - 0.07);
  vec3 h = q - (T + vec3(0.03, 0.0, 0.0));
  float head = sdRoundBox(h, vec3(0.045, 0.06, 0.08), 0.01);
  float d = min(base, links);
  if (joints < d) { d = joints; part = 1.0; }
  if (head < d) { d = head; part = 2.0; }
  return d;
}
float tray(vec3 p) {
  vec3 c = vec3(0.0, trayY(), -0.95);
  float o = sdRoundBox(p - c, vec3(0.6, 0.025, 0.3), 0.015);
  return max(o, -sdRoundBox(p - c - vec3(0.0, 0.035, 0.0), vec3(0.57, 0.03, 0.27), 0.01));
}
float mapObj(vec3 p, out int id) {
  id = 1;
  // the bench: a white slab
  float d = sdRoundBox(p - vec3(0, BY * 0.5, 0), vec3(1.7, BY * 0.5, 0.75), 0.02);
  float e = basinEll(p);
  float bs = max(abs(e + 0.01) - 0.01, p.y - (BY + BAS.y));
  bs = min(bs, sdTorus(p - vec3(0, BY + BAS.y, 0), vec2(BAS.x - 0.005, 0.016)));
  if (bs < d) { d = bs; id = 2; }
  float w = max(e + 0.02, p.y - WL());
  if (w < d) { d = w; id = 3; }
  vec3 cq = (p - vec3(0, BY + 0.02, 0)) / CS;
  float c = chalice(cq) * CS;
  if (c < d) { d = c; id = 4; }
  // the arms and the payout tray behind the bench
  float part;
  float h = arms(p, part);
  if (h < d) { d = h; id = 5; }
  float tr = tray(p);
  if (tr < d) { d = tr; id = 8; }
  // sensor poles either side, and the compliance ring over the cup
  vec3 sp = vec3(abs(p.x) - 1.35, p.y, p.z + 0.2);
  float pole = sdCapsule(sp, vec3(0, BY, 0), vec3(0, 2.0, 0), 0.022);
  float ring = sdTorus(p - vec3(0, BY + 0.02 + CS * uScanY, 0), vec2(0.34, 0.012));
  float scan = min(pole, ring);
  if (scan < d) { d = scan; id = 7; }
  // ceiling tubes above the room
  vec3 tp = p - vec3(0, 3.0, 0);
  tp.z = abs(tp.z + 0.5) - 1.3;
  float tube = sdCapsule(tp, vec3(-3.0, 0, 0), vec3(3.0, 0, 0), 0.035);
  if (tube < d) { d = tube; id = 6; }
  return d;
}
// a fingerprint: concentric distorted ridges in an oval
float print(vec2 uv, float seed) {
  float r = length(uv * vec2(1.0, 0.78));
  if (r > 1.0) return 0.0;
  float warp = 0.25 * fbm(uv * 3.0 + seed, 2) + 0.12 * uv.x * uv.y;
  float ridge = smoothstep(0.25, 0.0, abs(fract((r + warp) * 9.0) - 0.5) - 0.2);
  return ridge * smoothstep(1.0, 0.7, r);
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = M(vec3(0.86, 0.87, 0.88), 0.35, 0.0); m.clear = 0.6;
    if (n.y > 0.9) {
      // fingerprints surfacing on the white bench, and green transaction trails running to the back
      float fp = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 c = vec2((hash11(fi * 3.7) - 0.5) * 2.6, (hash11(fi * 7.1) - 0.5) * 1.1);
        if (length(c) < 0.85) c *= 1.35;
        vec2 uv = rot(fi * 1.3) * (p.xz - c) / 0.085;
        fp = max(fp, print(uv, fi) * step(fi * 0.18, uPrints));
      }
      float lane = abs(fract((p.x + 1.7) / 0.42) - 0.5) * 0.42;
      float dash = step(0.55, fract(p.z * 5.0 + uTime * 2.5 + floor((p.x + 1.7) / 0.42) * 0.37));
      float trail = smoothstep(0.006, 0.0, lane - 0.002) * dash * step(0.8, length(p.xz)) * uPrints;
      m.alb = mix(m.alb, vec3(0.25, 0.3, 0.26), fp * 0.8);
      m.emit = HGREEN * (0.9 * fp * uPrints + 1.4 * trail);
    }
    return m;
  }
  if (id == 2) { Mat m = SILVER(); m.rough = 0.1 + 0.08 * vnoise(p * 60.0); return m; }
  if (id == 4) {
    vec3 q = (p - vec3(0, BY + 0.02, 0)) / CS;
    Mat m = cupBlack(q, n);
    m.emit += vec3(0.8, 0.95, 1.0) * 3.0 * smoothstep(0.01, 0.0, abs(q.y - uScanY)) * uScanOn;
    return m;
  }
  if (id == 6) { Mat m = M(vec3(0.9), 0.3, 0.0); m.emit = vec3(3.0, 3.1, 3.3) * 2.2; return m; }
  if (id == 7) {
    Mat m = SILVER(); m.rough = 0.2;
    // light rings travelling up the poles; the scanner ring glows cold while it certifies
    float ring = smoothstep(0.03, 0.0, abs(fract(p.y * 1.4 - uTime * 0.8) - 0.5) - 0.46);
    m.emit = (abs(p.x) > 1.0 ? mix(vec3(2.4, 2.6, 2.8), HGREEN * 2.5, uCloud) * ring : vec3(2.2, 2.5, 2.8) * (0.3 + uScanOn));
    return m;
  }
  if (id == 8) { Mat m = SILVER(); m.rough = 0.08 + 0.05 * vnoise(p.xz * 40.0); return m; }
  if (id == 5) {
    float part; arms(p, part);
    if (part > 1.5) {
      // clamp tool head: pale housing, a green status ring
      Mat m = M(vec3(0.82, 0.83, 0.85), 0.3, 0.0); m.clear = 0.5;
      vec3 q = vec3(abs(p.x), p.y, p.z) - armTip();
      m.emit = HGREEN * 2.2 * smoothstep(0.006, 0.0, abs(q.x - 0.0) - 0.004) * step(0.0, 0.07 - abs(q.y));
      return m;
    }
    if (part > 0.5) { Mat m = M(vec3(0.84, 0.85, 0.87), 0.28, 0.0); m.clear = 0.5; return m; }
    Mat m = M(vec3(0.16, 0.16, 0.18), 0.3, 0.8);   // graphite links and base
    return dirty(m, p * 3.0, 0.15 * uCloud);
  }
  // water: clear, the silver floor of the basin seen through it, clouding green-black from the foot
  float r = length(p.xz);
  float fb = fbm(p.xz * 5.0 + uTime * 0.3, 4);
  float ink = sat(uCloud * 3.0) * smoothstep(0.0, -0.18, r - 0.1 - uCloud * 0.62 + 0.3 * (fb - 0.5));
  float vein = smoothstep(0.45, 0.72, fbm(p.xz * 11.0 - uTime * 0.2, 3));
  vec3 murk = mix(vec3(0.01, 0.02, 0.01), vec3(0.05, 0.12, 0.04), vein);
  Mat m = M(mix(vec3(0.55, 0.6, 0.62), murk, ink), mix(0.02, 0.05, ink), 0.0);
  m.clear = 1.0;
  m.trans = 0.55 * (1.0 - ink);
  m.emit = HGREEN * 0.7 * vein * ink;
  return m;
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('222, 228, 230', 1.0), uCycB: rgb('200, 208, 212', 0.85),
      uFloorCol: rgb('214, 218, 220', 0.8), uFloorRough: 0.14, uFloorGrain: 0.6, uGrime: 0.1,
      uHaze: 0.015, uHazeCol: rgb('220, 230, 235', 0.4),
      uKeyDir: [0.1, 1.0, 0.25], uKeyCol: [3.0, 3.1, 3.3], uKeySize: 0.5,
      uRimA: [1.6, 1.7, 1.8], uRimB: [1.6, 1.7, 1.8],
      uFaces: 0, uFreeze: 0, uHallGlow: 1,
      uCloud: 0, uRise: 0, uScanY: 1.2, uScanOn: 0, uPrints: 0, uExpo: 1,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uCloud.value = ease.out3(clamp((t - tBut) / 1.1, 0, 1));
      u.uPrints.value = ease.out3(clamp((t - tBut - 0.15) / 0.9, 0, 1));
      u.uRise.value = spring(t, tRaise - 0.1, 0.55, 0.25);
      // the certification sweep: the scanner ring runs down the cup on "clean"
      const k = clamp((t - tClean + 0.05) / 0.45, 0, 1);
      u.uScanY.value = 1.15 - 1.1 * ease.inOut3(k);
      u.uScanOn.value = t > tClean - 0.05 && k < 1 ? 1 : 0;
      // out of the dark of s17
      u.uExpo.value = 0.02 + 0.98 * ease.out3(clamp((t - P.from) / 0.3, 0, 1));
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.3 }); },
  };
};
