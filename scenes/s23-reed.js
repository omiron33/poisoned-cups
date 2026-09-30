// 23 · "A cracked reed bruised / I will never crush or kill"
// After the collapse, quiet. The film's one soft transition: the frame fades up out of the dark of
// s22 into a dim warm pocket among the debris of the fallen control room: toppled dead screens,
// a slumped stack of server slabs, glass shards on wet concrete. In the middle one thin green fibre
// still stands out of a junction box, cracked and bent over at a node but not broken, its core
// glowing faintly, light leaking at the crack; beside it a snapped antenna mast still blinks.
// Nothing attacks. On "I" a warm gold-white light gathers softly over them and holds.
import { grade, rgb, linesFrom, clamp01, ease, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';

const [L1, L2] = linesFrom('A cracked reed', 'I will never crush');

export function rig(P) {
  const tI = L2.words[0].start;
  const camera = (t) => {
    const u = t - P.from;
    const k = ease.inOut3(u / (P.to - P.from));
    const d = 0.004 * Math.sin(t * 0.6);
    return { pos: [0.55 - 0.25 * k + d, 0.5 - 0.06 * k, 1.9 - 0.4 * k], target: [0.05, 0.42 - 0.04 * k, 0.0], fov: 38, roll: 0 };
  };
  const warm = (t) => ease.inOut3((t - tI + 0.1) / 1.2);
  return { camera, tI, warm };
}

export default (P) => {
  const R = rig(P);
  return {
    name: 's23-reed', from: P.from, to: P.to,
    frag: STUDIO_GLSL + /* glsl */ `
uniform float uWarm, uSway, uBlink, uFade;
const vec3 K = vec3(0.0, 0.62, 0.0);
vec3 midP() { float a = 0.55 + 0.03 * uSway; return K + vec3(sin(a), cos(a), 0.12) * 0.2; }
vec3 tipP() { float a = 1.45 + 0.06 * uSway; return midP() + vec3(sin(a), cos(a), 0.2) * 0.22; }
float reed(vec3 p) {
  float s = sdRoundCone(p, vec3(0.0, 0.05, 0.0), K, 0.008, 0.0065);
  s = min(s, sdRoundCone(p, K, midP(), 0.0065, 0.005));
  s = min(s, sdRoundCone(p, midP(), tipP(), 0.005, 0.0028));
  // ferrule rings where the sheath is jointed
  s = min(s, length(vec2(length(p.xz) - 0.011, p.y - 0.3)) - 0.004);
  return s;
}
// a small sensor pod at the snapped mast's hinge
float sdCylinderish(vec3 q) { return sdRoundBox(q - vec3(0.0, 0.66, 0.0), vec3(0.025, 0.04, 0.025), 0.008); }
float mapObj(vec3 p, out int id) {
  id = 1;
  float d = reed(p);
  // the junction box it grows from
  float jb = sdRoundBox(p - vec3(0.0, 0.03, 0.0), vec3(0.06, 0.03, 0.05), 0.006);
  if (jb < d) { d = jb; id = 2; }
  // the snapped antenna mast: a lower section standing, the top hanging off at an angle
  vec3 aq = p - vec3(-0.42, 0.0, -0.25);
  float an = sdCapsule(aq, vec3(0.0), vec3(0.0, 0.7, 0.0), 0.008);
  an = min(an, sdCapsule(aq, vec3(0.0, 0.02, 0.0), vec3(0.08, 0.0, 0.05), 0.006));
  an = min(an, sdCapsule(aq, vec3(0.0, 0.02, 0.0), vec3(-0.08, 0.0, 0.05), 0.006));
  an = min(an, sdCapsule(aq, vec3(0.0, 0.02, 0.0), vec3(0.0, 0.0, -0.09), 0.006));
  an = min(an, sdCapsule(aq, vec3(0.0, 0.7, 0.0), vec3(0.06, 0.48, 0.08), 0.005));
  an = min(an, sdCylinderish(aq));
  if (an < d) { d = an; id = 3; }
  float led = length(aq - vec3(0.06, 0.48, 0.08)) - 0.01;
  if (led < d) { d = led; id = 4; }
  // debris of the fallen control room
  if (length(p.xz - vec2(0.0, -0.3)) < 2.4) {
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float a = fi * 2.1 + 0.9, r = 0.45 + 0.5 * hash11(fi + 1.3);
      vec3 c = vec3(cos(a) * r, 0.0, sin(a) * r * 0.8 - 0.35);
      if (c.z > 0.2) c.z -= 0.7;
      vec3 b = i < 3 ? vec3(0.28, 0.17, 0.012) : vec3(0.16, 0.03, 0.12) * (0.8 + 0.5 * hash11(fi + 3.0));
      vec3 q = p - c - vec3(0.0, i < 3 ? 0.1 : 0.03, 0.0);
      q.xz *= rot(fi * 1.7);
      if (i < 3) q.yz *= rot(-0.9 - 0.4 * hash11(fi + 5.0)); else q.xy *= rot(0.2 * (hash11(fi + 9.0) - 0.5));
      float bx = sdRoundBox(q, b, 0.006);
      if (bx < d) { d = bx; id = i < 3 ? 5 : 6; }
    }
  } else d = min(d, length(p.xz - vec2(0.0, -0.3)) - 2.3);
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    // a glass fibre in a green sheath: faint core light, a bright leak at the cracked node
    Mat m = M(vec3(0.03, 0.12, 0.05), 0.25, 0.0); m.clear = 0.8;
    float crack = exp(-length(p - K) * 45.0);
    float tip = exp(-length(p - tipP()) * 60.0);
    float fib = 0.6 + 0.4 * vnoise(vec2(atan(p.z, p.x) * 12.0, p.y * 40.0));
    m.emit = vec3(0.12, 0.7, 0.2) * (0.25 * fib + 3.0 * crack + 2.0 * tip) * (0.8 + 0.2 * sin(uTime * 2.1));
    m.alb = mix(m.alb, vec3(0.2, 0.18, 0.08), crack * 0.6);
    return m;
  }
  if (id == 2) return dirty(M(vec3(0.05, 0.05, 0.055), 0.4, 0.5), p, 0.6);
  if (id == 3) return dirty(M(vec3(0.5, 0.5, 0.52), 0.3, 1.0), p, 0.5);
  if (id == 4) { Mat m = M(vec3(0.05), 0.3, 0.0); m.emit = vec3(0.3, 1.8, 0.4) * uBlink; return m; }
  if (id == 5) {
    // a toppled dead screen: black glass with a spider crack, a few stuck pixels
    Mat m = M(vec3(0.015), 0.05, 0.0); m.clear = 1.0;
    float e = voronoiEdge(p.xz * 14.0 + p.y * 9.0).x;
    m.rough = mix(0.5, 0.05, smoothstep(0.0, 0.04, e));
    m.alb += vec3(0.12) * smoothstep(0.03, 0.0, e) * step(0.5, vnoise(p.xz * 6.0));
    return m;
  }
  if (id == 6) return dirty(M(vec3(0.1, 0.1, 0.11), 0.35, 0.8), p, 0.7);
  return M(vec3(0.3), 0.8, 0.0);
}
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth) * uFade;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('112, 76, 58', 1.2), uCycB: rgb('22, 16, 18', 1.0),
      uFloorCol: rgb('58, 56, 58', 1.0), uFloorRough: 0.12, uFloorGrain: 0.5,
      uGrime: 0.95, uHaze: 0.06, uHazeCol: [0.06, 0.045, 0.035],
      uKeyDir: [-0.4, 0.85, 0.3], uKeyCol: [1.7, 1.55, 1.4], uKeySize: 0.4,
      uRimA: [2.0, 1.1, 0.6], uRimB: [0.8, 1.5, 0.9],
      uP1: [0.02, 0.66, 0.1], uP1c: [0.05, 0.3, 0.08],
      uP2: [0.15, 1.0, 0.45], uP2c: [0, 0, 0],
      uWarm: 0, uSway: 0, uBlink: 0, uFade: 0,
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const w = R.warm(t);
      u.uWarm.value = w;
      u.uSway.value = Math.sin((t - P.from) * 1.1);
      u.uBlink.value = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin((t - P.from) * 2.6), 6);
      // the soft transition: the frame fades up out of s22's dark
      u.uFade.value = 0.12 + 0.88 * ease.inOut3((t - P.from) / 0.9);
      // warm gold-white light gathers over the reed on "I" and holds
      u.uP2c.value = [3.2, 2.5, 1.5].map((c) => c * (0.25 + 1.1 * w));
      u.uKeyCol.value = mix([1.7, 1.55, 1.4], [2.8, 2.3, 1.7], w);
      u.uCycA.value = rgb('112, 76, 58', 1.2 + 0.7 * w);
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.5, bloom: 0.1 }); },
  };
};
