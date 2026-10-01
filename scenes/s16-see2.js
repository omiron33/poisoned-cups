// 16 · "Brood of vipers / Do you think I can't see still?" (v2)
// Out of the incense fog: the black titanium chalice on its plinth in the data hall, three black
// cable-vipers pouring over its lip and down the plinth like a living harness, the face screens and
// the LED wall grinning behind. On "I" the same warm shaft of light as in s08 falls from above onto
// the cup (no machine, no HUD: light). On "see" the titanium goes translucent where the light holds
// it and the green poison inside shows through the wall, swirling; in the same instant every face
// in the hall freezes, flat-mouthed and magenta: caught. The camera leans in and holds on the cup.
import { ease, grade, rgb, orbit, linesAt, clamp01, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { CUP_GLSL } from '/song/lib/x-cup.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { HALL_GLSL, HALL_UNIFORMS } from '/song/lib/x-a.js';

// v3: the opening camera move after the cut: a small dolly-in that eases in and settles over
// ~0.6 s (36 frames), so the shot never lands on a dead stop just after the cut
const settleIn = (cam, t, t0, amt = 0.05, dur = 0.6) => {
  const x = (t - t0) / dur;
  if (x >= 1) return cam;
  const k = 1 - ease.inOut3(Math.max(0, x));
  return { ...cam, pos: cam.pos.map((v, i) => v + (v - cam.target[i]) * amt * k) };
};

const CUP = [0.0, 0.9, 0.0];
export const lines16 = (P) => linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');

export default (P) => {
  const t0 = P.from;
  const [, L2] = lines16(P);
  const tI = L2.words.find((w) => /^i$/i.test(w.w)).start;
  const tSee = L2.words.find((w) => /^see/i.test(w.w)).start;
  const camera = (t) => {
    const u = t - t0;
    const a = spring(t, tI - 0.03, 0.5, 0.2);
    const b = spring(t, tSee - 0.02, 0.45, 0.25);
    const target = mix([-0.95, 1.05, 0], [-0.7, 1.2, 0], a);
    return orbit(t, { target, yaw: 0.35 - 0.035 * u, pitch: 0.12 + 0.04 * a, dist: 4.3 - 0.5 * a - 0.35 * b - 0.04 * u, fov: 36, drift: 0.01 });
  };
  const beamAt = (t) => {
    const on = ease.out5((t - tI + 0.02) / 0.08);
    const flash = Math.exp(-Math.max(0, t - tSee) * 5) * (t >= tSee ? 1 : 0);
    return { on: on * (1 + 0.5 * flash), x: CUP[0], z: CUP[2], r: 0.55, xray: t >= tSee - 0.02 ? ease.out3((t - tSee + 0.02) / 0.12) : 0 };
  };
  return {
    name: 's16-see2', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + CUP_GLSL + VIPER_GLSL + HALL_GLSL + /* glsl */ `
uniform vec4 uBeam;
uniform float uXray, uPour;
const vec3 CUPP = vec3(${CUP.join(', ')});
float mapObj(vec3 p, out int id) {
  id = 5;
  float d = sdBox(p - vec3(0, 0.45, 0), vec3(0.34, 0.45, 0.34)) - 0.005;
  vec3 cq = (p - CUPP) / 0.85;
  float c = chalice(cq) * 0.85;
  if (c < d) { d = c; id = 4; }
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
  } else d = min(d, b);
  int hid; float h = hallSDF(p, hid); if (h < d) { d = h; id = hid; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id >= 40) return hallMat(id, p, n);
  if (id == 1) return viperMat(0.0);
  if (id == 4) {
    vec3 q = (p - CUPP) / 0.85;
    Mat m = cupBlack(q, n);
    // held in the light, the metal goes translucent: the poison seen through the wall of the bowl
    vec2 r = revo(q);
    float bowl = smoothstep(0.6, 0.7, r.y) * smoothstep(0.93, 0.86, r.y);
    float face = pow(sat(dot(n, normalize(uCamPos - p))), 1.2);
    // parallax: the swirl sits deeper than the wall, so sample it pushed along the view ray
    vec3 dq = q - normalize(uCamPos - p) * 0.12;
    float swirl = fbm(vec3(dq.x * 7.0, dq.y * 7.0 - uTime * 0.8, dq.z * 7.0), 3);
    vec3 green = HGREEN * (0.15 + 1.4 * smoothstep(0.45, 0.7, swirl));
    m.emit += green * uXray * bowl * face;
    m.alb *= 1.0 - 0.7 * uXray * bowl;
    return m;
  }
  Mat m = LACQUER(vec3(0.012, 0.012, 0.014)); m.rough = 0.22;   // black plinth
  return dirty(m, p, 0.2);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  if (uBeam.w > 0.001) {
    float r = uBeam.z;
    vec3 p = ro + rd * min(depth, 60.0);
    float m = smoothstep(r, r * 0.55, length(p.xz - uBeam.xy)) * step(depth, 100.0) * step(p.y, 5.0);
    col *= 1.0 + uBeam.w * m * vec3(8.0, 7.0, 5.4) * 0.5;
    col += uBeam.w * m * vec3(0.05, 0.04, 0.025);
    vec2 o = ro.xz - uBeam.xy, dv = rd.xz;
    float A = dot(dv, dv), B = dot(o, dv), C = dot(o, o) - r * r;
    float disc = B * B - A * C;
    if (disc > 0.0 && A > 1e-6) {
      float sq = sqrt(disc);
      float ta = max((-B - sq) / A, 0.0), tb = min((-B + sq) / A, min(depth, 40.0));
      float dmin = length(o + dv * (-B / A));
      float len = max(tb - ta, 0.0) * (1.0 - dmin * dmin / (r * r));
      col += uBeam.w * vec3(1.0, 0.86, 0.62) * len * 0.3;
    }
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS, ...HALL_UNIFORMS,
      uKeyCol: [2.4, 2.5, 2.8], uExpo: 1.15,
      uBeam: [0, 0, 0.55, 0], uXray: 0, uPour: 0.5,
    },
    camera: (t) => settleIn(camera(t), t, P.from),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const b = beamAt(t);
      u.uBeam.value = [b.x, b.z, b.r, b.on];
      u.uXray.value = b.xray;
      u.uPour.value = 0.6 + 0.12 * (t - t0);
      // the incense fog of s15 clearing as the scene opens
      u.uHaze.value = 0.06 + 0.14 * (1 - ease.inOut3((t - t0) / 1.2));
      u.uP1.value = [b.x, 3.2, b.z]; u.uP1c.value = [5 * b.on, 4.4 * b.on, 3.4 * b.on];
      // caught: every face in the hall freezes on "see"
      u.uFreeze.value = t >= tSee ? 1 : 0;
      u.uHallGlow.value = 1 - 0.35 * b.on;
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.08 }); },
  };
};
