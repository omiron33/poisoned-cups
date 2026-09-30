// 16 · "Brood of vipers / Do you think I can't see still?"
// Out of incense smoke: the titanium chalice on its plinth, polished and spotless, and cable-vipers
// pouring over its lip and down the plinth to the floor. On "I" the same warm-white shaft as in s08
// falls on the cup; on "see" the light goes through the metal like an X-ray and the acid-green
// poison inside shows through the wall. He sees the inside. Exit: the shaft slides off the cup onto
// a pair of gold goggles lying on the floor (s17).
import { ease, grade, rgb, orbit, linesAt, clamp01, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';

const CUP = [0.0, 0.9, 0.0], GOG = [0.95, 0.0, 0.55];

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');
  const tI = L2.words.find((w) => /^i$/i.test(w.w)).start;
  const tSee = L2.words.find((w) => /^see/i.test(w.w)).start;
  const tEnd = L2.words[L2.words.length - 1].end;
  const camera = (t) => {
    const u = t - t0;
    const a = spring(t, tI - 0.03, 0.5, 0.2);
    const g = ease.inOut3((t - (P.to - 0.7)) / 0.6);
    const target = mix(mix([-0.95, 1.05, 0], [-0.85, 1.15, 0], a), [GOG[0] - 0.3, 0.3, GOG[1]], g);
    return orbit(t, { target, yaw: 0.35 - 0.04 * u, pitch: 0.12 + 0.03 * a + 0.35 * g, dist: 4.2 - 0.6 * a - 1.2 * g, fov: 36, drift: 0.01 });
  };
  const beamAt = (t) => {
    const on = ease.out5((t - tI + 0.02) / 0.08);
    const flash = Math.exp(-Math.max(0, t - tSee) * 5) * (t >= tSee ? 1 : 0);
    const g = ease.inOut3((t - Math.max(tEnd, P.to - 0.75)) / 0.5);
    return { on: on * (1 + 0.6 * flash), x: mix(CUP[0], GOG[0], g), z: mix(CUP[2], GOG[1], g), r: mix(0.5, 0.32, g), xray: t >= tSee ? clamp01(1 - (t - tSee - 1.2) / 0.6) * ease.out3((t - tSee) / 0.12) : 0 };
  };
  return {
    name: 's16-see2', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CUP_GLSL + VIPER_GLSL + /* glsl */ `
uniform vec4 uBeam;
uniform float uXray, uPour;
const vec3 CUPP = vec3(${CUP.join(', ')});
const vec3 GOG = vec3(${GOG.join(', ')});
float goggles(vec3 p) {
  vec3 q = p - GOG - vec3(0, 0.022, 0);
  q.xz = rot(0.5) * q.xz;
  vec3 a = vec3(abs(q.x) - 0.1, q.y, q.z);
  float rim = sdTorus(a, vec2(0.075, 0.016));
  float lens = sdCyl(a, 0.07, 0.006);
  float bridge = sdCapsule(q, vec3(-0.03, 0.01, 0), vec3(0.03, 0.01, 0), 0.012);
  float strap = sdTorus(vec3(q.x, q.y + 0.01, q.z + 0.12) * vec3(0.55, 1.0, 1.0), vec2(0.16, 0.009));
  return min(min(rim, bridge), min(lens, strap * 0.6));
}
float mapObj(vec3 p, out int id) {
  id = 5;
  float d = sdBox(p - vec3(0, 0.45, 0), vec3(0.34, 0.45, 0.34)) - 0.005;
  vec3 cq = (p - CUPP) / 0.85;
  float c = chalice(cq) * 0.85;
  if (c < d) { d = c; id = 4; }
  float g = goggles(p);
  if (g < d) { d = g; id = 6; }
  // vipers pour over the lip and down the plinth: own x runs down the world, y outward
  float T = uTime;
  float b = length(p - vec3(0, 1.0, 0)) - 1.3;
  if (b < 0.3) {
    for (int k = 0; k < 3; k++) {
      float ang = float(k) * 2.1 + 0.4;
      vec2 dir = vec2(cos(ang), sin(ang));
      vec3 q = p - (CUPP + vec3(dir.x * 0.18, 0.86, dir.y * 0.18));
      vec3 lq = vec3(-q.y, dot(q.xz, dir), dot(q.xz, vec2(-dir.y, dir.x)));
      float L = uPour * (1.0 + 0.25 * float(k));
      float v = sdViper(lq, L, 0.055, 0.09, 6.0, T * 2.0 + float(k), 0.24 + 0.1 * L, 1.0, vec3(0, 1, 0));
      if (v < d) { d = v; id = 1; keepViper(); }
    }
  }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) return viperMat(0.0);
  if (id == 6) {
    if (abs(p.y - 0.028) < 0.012 && n.y > 0.8) { Mat m = M(vec3(0.01), 0.04, 0.0); m.clear = 1.0; return m; }
    return GOLD();
  }
  if (id == 4) {
    vec3 q = (p - CUPP) / 0.85;
    Mat m = cupTi(q, n);
    // X-ray: the poison seen through the wall of the bowl
    vec2 r = revo(q);
    float bowl = smoothstep(0.55, 0.7, r.y) * smoothstep(1.02, 0.92, r.y);
    float face = pow(sat(dot(n, normalize(uCamPos - p))), 1.5);
    float swirl = 0.6 + 0.4 * fbm(vec3(q.x * 8.0, q.y * 8.0 - uTime, q.z * 8.0), 3);
    m.emit += vec3(0.1, 0.9, 0.12) * uXray * bowl * face * swirl;
    m.alb *= 1.0 - 0.6 * uXray * bowl;
    return m;
  }
  Mat m = M(vec3(0.12, 0.12, 0.125), 0.25, 0.0); m.clear = 0.6;   // black stone plinth
  return dirty(m, p, 0.3);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  if (uBeam.w > 0.001) {
    float r = uBeam.z;
    vec3 p = ro + rd * min(depth, 60.0);
    float m = smoothstep(r, r * 0.55, length(p.xz - uBeam.xy)) * step(depth, 100.0) * step(p.y, 5.0);
    col *= 1.0 + uBeam.w * m * vec3(4.0, 3.7, 3.2);
    col += uBeam.w * m * vec3(0.04, 0.036, 0.03);
    vec2 o = ro.xz - uBeam.xy, dv = rd.xz;
    float A = dot(dv, dv), B = dot(o, dv), C = dot(o, o) - r * r;
    float disc = B * B - A * C;
    if (disc > 0.0 && A > 1e-6) {
      float sq = sqrt(disc);
      float ta = max((-B - sq) / A, 0.0), tb = min((-B + sq) / A, min(depth, 40.0));
      float dmin = length(o + dv * (-B / A));
      col += uBeam.w * vec3(1.0, 0.93, 0.82) * max(tb - ta, 0.0) * (1.0 - dmin * dmin / (r * r)) * 0.1;
    }
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('92, 84, 72', 1.4), uCycB: rgb('30, 28, 28', 1.2),
      uFloorCol: rgb('96, 96, 92', 0.85), uFloorRough: 0.1, uGrime: 0.85,
      uKeyDir: [-0.5, 0.8, 0.4], uKeyCol: [1.8, 1.7, 1.55], uKeySize: 0.45, uExpo: 1.15,
      uRimA: [2.0, 0.8, 0.3], uRimB: [1.4, 1.55, 1.7],
      uHaze: 0.12, uHazeCol: [0.07, 0.065, 0.06],
      uBeam: [0, 0, 0.5, 0], uXray: 0, uPour: 0.5,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const b = beamAt(t);
      u.uBeam.value = [b.x, b.z, b.r, b.on];
      u.uXray.value = b.xray;
      u.uPour.value = 0.6 + 0.12 * (t - t0);
      // incense smoke clearing as the scene opens
      u.uHaze.value = 0.03 + 0.12 * (1 - ease.inOut3((t - t0) / 1.2));
      u.uP1.value = [b.x, 3.2, b.z]; u.uP1c.value = [5 * b.on, 4.6 * b.on, 3.9 * b.on];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
