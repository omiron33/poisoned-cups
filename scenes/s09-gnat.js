// 09 · "You strain a gnat / Let the camel through"
// Outside: macro on a hyper-fine steel filter mesh stretched in a checkpoint portal (lane A, its
// frame strip pulsing alert magenta); caught in the wires, one tiny insect-drone, its body
// glitching with dead pixels, rotors twitching. Inside: on "Let" the camera pulls back to show the
// next lane: a huge open portal lit approval green, and an armoured black cargo block (an oversized
// data container) slides straight through it at speed, unchecked, its nose crossing the gate on
// "camel", dead centre on "through", then on at the camera until it fills the frame.
import { ease, grade, rgb, orbit, spring, linesFrom } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';

const [L1, L2] = linesFrom('You strain a gnat', 'Let the camel through');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };
export const BUG = [0.02, 1.0, 0.012];
const LANE_B = -2.5;

export function gnatTimes() {
  const tLet = L2.words[0].start;
  const tCam = L2.words.find((w) => /camel/i.test(w.w)).start;
  const tThr = L2.words.find((w) => /through/i.test(w.w)).start;
  return { tLet, tCam, tThr };
}
export function gnatCamera(P) {
  const { tLet, tCam } = gnatTimes();
  return (t) => {
    const k = ease.inOut3((t - (tLet - 0.3)) / 1.0);
    const u = t - P.from;
    const m = (a, b) => a + (b - a) * k;
    // a kick as the cargo crosses the gate
    const kick = t > tCam ? 0.012 * Math.exp(-(t - tCam) * 9) * Math.sin((t - tCam) * 60) : 0;
    return orbit(t, {
      target: [m(BUG[0], -1.7), m(BUG[1], 1.2) + kick, m(BUG[2], 0.4)],
      yaw: m(0.32 + 0.02 * u, 0.62 - 0.03 * (t - tLet)),
      pitch: m(0.08, 0.1),
      dist: m(0.36 - 0.02 * u, 7.4 - 0.25 * (t - tLet)),
      fov: m(30, 38), drift: 0.005,
    });
  };
}

export default (P) => {
  const { tLet, tCam, tThr } = gnatTimes();
  const HL = 2.6;                                  // container half length
  const v = HL / Math.max(0.3, tThr - tCam);       // nose at the gate on "camel", centred on "through"
  const zc = (t) => -HL + v * (t - tCam);
  return {
    name: 's09-gnat', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + /* glsl */ `
uniform float uZc, uTear, uAlert;
const vec3 BUGP = vec3(${BUG.join(', ')}) + vec3(0.0, 0.0, 0.0);
const float LB = ${LANE_B.toFixed(2)};
// lane A: a slim portal with a hyper-fine mesh stretched across it (plane z = 0)
float sdPortalA(vec3 p, out int id) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  float post = sdBox(q - vec3(0.72, 0.95, 0.0), vec3(0.06, 0.95, 0.09));
  float beam = sdBox(p - vec3(0.0, 1.87, 0.0), vec3(0.78, 0.07, 0.09));
  float d = min(post, beam); id = 2;
  float bb = sdBox(p - vec3(0.0, 0.93, 0.0), vec3(0.67, 0.9, 0.012));
  if (bb > d || bb > 0.02) return min(d, bb + 0.005);
  const float S = 0.0045;
  float gx = (fract(p.x / S) - 0.5) * S, gy = (fract(p.y / S) - 0.5) * S;
  float wv = 0.0004 * sin(p.x / S * 3.14159) * sin(p.y / S * 3.14159);
  float wa = length(vec2(gy, p.z - wv)) - 0.00055;
  float wb = length(vec2(gx, p.z + wv)) - 0.00055;
  float mesh = max(min(wa, wb), sdBox(p - vec3(0.0, 0.93, 0.0), vec3(0.66, 0.88, 0.05)));
  if (mesh < d) { d = mesh; id = 3; }
  return d;
}
// the insect-drone: a pill body, a lens head, four rotor arms, one leg snagged in the wires
float sdBug(vec3 p) {
  vec3 q = p - BUGP;
  if (length(q) > 0.06) return length(q) - 0.05;
  q.xy = rot(0.35) * q.xy;
  float d = sdEllipsoid(q - vec3(-0.003, 0.0, 0.004), vec3(0.016, 0.0055, 0.0065));
  d = smin(d, sdSphere(q - vec3(0.012, 0.0, 0.005), 0.005), 0.003);
  vec3 r = vec3(abs(q.x + 0.002), q.y, q.z);
  float arm = sdCapsule(r, vec3(0.0, 0.0, 0.006), vec3(0.016, 0.01, 0.01), 0.0008);
  arm = sdCapsule(vec3(abs(q.x + 0.002), abs(q.y), q.z), vec3(0.0, 0.0, 0.006), vec3(0.016, 0.01, 0.011), 0.0007);
  vec3 rq = vec3(abs(q.x + 0.002) - 0.016, abs(q.y) - 0.01, q.z - 0.011);
  float rotor = sdCyl(rq.xzy, 0.0042, 0.00025);
  d = min(d, min(arm, rotor));
  d = min(d, sdCapsule(q, vec3(-0.006, -0.004, 0.002), vec3(-0.012, -0.012, -0.001), 0.0007));
  return d;
}
// lane B: a wide portal, open, and the armoured cargo block sliding through it
float sdPortalB(vec3 p) {
  vec3 q = vec3(abs(p.x - LB), p.y, p.z);
  float post = sdBox(q - vec3(1.45, 1.5, 0.0), vec3(0.1, 1.5, 0.14));
  float beam = sdBox(vec3(p.x - LB, p.y - 3.05, p.z), vec3(1.55, 0.1, 0.14));
  return min(post, beam);
}
float sdCargo(vec3 p) {
  vec3 q = p - vec3(LB, 1.3, uZc);
  float bb = sdBox(q, vec3(1.25, 1.25, ${(HL + 0.1).toFixed(2)}));
  if (bb > 0.1) return bb;
  float d = sdRoundBox(q, vec3(1.1, 1.1, ${HL.toFixed(2)}), 0.04);
  // corrugated armour on the sides, corner castings
  d += 0.008 * smoothstep(0.9, 1.1, abs(q.x)) * sin(q.z * 36.0);
  vec3 c = abs(q) - vec3(1.08, 1.08, ${(HL - 0.02).toFixed(2)});
  d = min(d, sdBox(c, vec3(0.08)) - 0.01);
  return d;
}
float mapObj(vec3 p, out int id) {
  float d = sdPortalA(p, id);
  float b = sdBug(p);
  if (b < d) { d = b; id = 4; }
  float pb = sdPortalB(p);
  if (pb < d) { d = pb; id = 5; }
  float c = sdCargo(p);
  if (c < d) { d = c; id = 6; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 2 || id == 5) {
    // gunmetal portal frames with an emissive strip on the inner face
    Mat m = M(vec3(0.12, 0.12, 0.14), 0.3, 0.9);
    float inner = id == 2 ? step(abs(abs(p.x) - 0.66), 0.012) : step(abs(abs(p.x - LB) - 1.35), 0.012);
    float under = id == 2 ? step(abs(p.y - 1.8), 0.012) : step(abs(p.y - 2.95), 0.012);
    vec3 ec = id == 2 ? vec3(3.0, 0.3, 1.6) * uAlert : vec3(0.5, 3.0, 0.9);
    m.emit = ec * max(inner, under);
    return dirty(m, p * 2.0, 0.4);
  }
  if (id == 3) { Mat m = SILVER(); m.rough = 0.25; return m; }
  if (id == 4) {
    Mat m = M(vec3(0.03), 0.12, 1.0);
    vec3 c = floor(p * 1100.0);
    float h = hash13(c + floor(uTime * 15.0));
    m.emit = step(0.78, h) * mix(vec3(0.3, 2.6, 0.8), vec3(2.6, 0.3, 1.6), step(0.9, h)) * 1.6;
    return m;
  }
  // the cargo: black armour plate, silver castings, a green clearance band round its base
  vec3 q = p - vec3(LB, 1.3, uZc);
  Mat m = M(vec3(0.2, 0.21, 0.23), 0.3 + 0.2 * vnoise(q * 6.0), 0.85);
  m.clear = 0.5;
  vec3 c = abs(q) - vec3(1.08, 1.08, ${(HL - 0.02).toFixed(2)});
  if (max(c.x, max(c.y, c.z)) > -0.1 && min(c.x, min(c.y, c.z)) > -0.1) { m = SILVER(); m.rough = 0.3; }
  float band = step(abs(q.y + 0.85), 0.03) * step(1.0, abs(q.x) + 0.12);
  float chev = step(0.5, fract(q.z * 1.5 + q.y * 1.5)) * step(abs(q.y - 0.75), 0.05) * step(1.0, abs(q.x) + 0.12);
  m.emit = vec3(0.4, 2.6, 0.8) * band + vec3(0.3, 1.6, 0.5) * chev;
  return dirty(m, p * 1.1, 0.5);
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('92, 70, 120', 1.6), uCycB: rgb('26, 22, 38', 1.2),
      uFloorCol: rgb('60, 60, 66', 0.7), uFloorRough: 0.1, uGrime: 0.95,
      uKeyDir: [0.45, 0.9, 0.55], uKeyCol: [3.0, 3.1, 3.5], uKeySize: 0.3,
      uRimA: [3.4, 3.5, 3.9], uRimB: [0.7, 3.2, 1.1],
      uHaze: 0.05, uHazeCol: [0.06, 0.05, 0.08],
      uZc: -20, uTear: 0, uAlert: 1,
    },
    camera: gnatCamera(P),
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uZc.value = zc(t);
      u.uTear.value = t >= tCam && t < tCam + 0.05 ? 1 : 0;
      u.uAlert.value = 0.55 + 0.45 * (Math.sin(t * 9) > 0 ? 1 : 0.2);
      // the drone's own glow, and the green of the approved lane
      setV(u, 'uP1', [BUG[0], BUG[1] + 0.05, BUG[2] + 0.08]);
      setV(u, 'uP1c', [0.05 * u.uAlert.value, 0.01, 0.03 * u.uAlert.value]);
      setV(u, 'uP2', [LANE_B, 2.6, 1.2]);
      setV(u, 'uP2c', [1.2, 7.0, 2.2]);
    },
    post(t) { return grade(t, { exposure: 1.05, bloom: 0.08 }); },
  };
};
