// 20 · "You stand in the door / Won't walk in / Or let the poor" (v4 REWORK)
// A tall door of warm light in a black, wet concrete wall, the protected chamber beyond. In the
// doorway a chrome scan gate, its ring lights green; in front of it a row of speed-gate cabinets with
// glass flaps and LED tops. Standing in the gate, arms folded, a tall man in a sharp suit: revealed
// on "stand" as the gate's cold lights come up on him (cold key from the front, white rims against
// the warm door), and he never moves again. On "Won't" the system hard-locks: lights snap to red,
// the flaps slam, red barrier lines string across every lane; the camera stops on a spring.
// On "Or" a low 3/4 front angle from beside the end of the barrier, looking back at the people kept
// out: a mother with a child on her hip, an old man holding out a tin cup, a young man holding up a
// phone glowing red at 3 %, a woman with a bag on her shoulder, all front-lit warm by the door's
// spill with a cold rim behind. On "poor" the red barrier lines flare across them. The door's light
// swells at the end (s21 turns it to fire): here it is the warm spill on the people that swells.
import { ease, grade, rgb, orbit, linesAt, spring, clamp } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { FIGURE_GLSL } from '/song/lib/x-v4-figure.js';

export const lines20 = (P) => linesAt(P.from - 0.5, 'You stand in the door', 'Won', 'Or let the poor');

// the four kept out (shot B), in world space: [x, z, yaw offset from facing the door]
// screen order left to right (camera looks +z from x > 0): phone, mother, old man, woman with bag
export const PEOPLE = [
  { x: 1.55, z: 6.9, label: 'DENIED  0.97' },   // young man, phone up
  { x: 0.4, z: 7.25, label: 'DENIED  0.91' },   // mother and child
  { x: -0.75, z: 7.6, label: 'DENIED  0.88' },  // old man, tin cup
  { x: -1.95, z: 7.95, label: 'DENIED  0.93' },  // woman, bag on her shoulder
];
const BAR_B = 3.7;   // shot B: the barrier lines' plane (z) in front of the people

export const camera20 = (P) => {
  const [L1, L2, L3] = lines20(P);
  const tWont = L2.words[0].start, tOr = L3.words[0].start;
  return (t) => {
    if (t < tOr) {
      // square on to the door from the barrier line, pushing in from the cut; on "Won't" the push is
      // caught by a spring and held (a hard stop that still settles)
      const u = Math.min(t, tWont) - P.from;
      const s = t > tWont ? spring(t, tWont, 0.35, 0.25) : 0;
      const open = ease.out3(clamp((t - P.from) / 1.2, 0, 1));
      return orbit(t, { target: [0, 1.12, 0], yaw: 0.0, pitch: 0.06 + 0.04 * (1 - open), dist: 3.75 - 0.16 * u - 0.12 * s - 0.25 * open, fov: 40, drift: t > tWont ? 0.001 : 0.003 });
    }
    // low 3/4 front: beside the end of the barrier, looking back out at the people; a slow creep in
    const u = t - tOr;
    const k = ease.out3(clamp(u / 2.6, 0, 1));
    const d = 0.004 * Math.sin(t * 0.8);
    return { pos: [1.75 - 0.1 * k + d, 0.6 + 0.03 * k, 2.3 + 0.3 * k], target: [-0.1 - 0.05 * k, 1.52 + d, 7.5], fov: 44, roll: 0.006 };
  };
};

export default (P) => {
  const [, L2, L3] = lines20(P);
  const tStand = lines20(P)[0].words[1].start;
  const tWont = L2.words[0].start, tOr = L3.words[0].start, tPoor = L3.words[L3.words.length - 1].start;
  const pv = (i) => `vec3(${PEOPLE[i].x.toFixed(3)}, 0.0, ${PEOPLE[i].z.toFixed(3)})`;
  return {
    name: 's20-door', from: P.from, to: P.to,
    frag: STUDIO_GLSL + FIGURE_GLSL + /* glsl */ `
uniform float uLock, uFlap, uBar, uSwell, uShot, uBarZ, uBarX, uManKey, uBarH;
const float DW = 0.55, DH = 2.3;
// poses, set once per pixel in shade()
vec4 mA, mB, mC;            // the man in the door
vec4 pA[4], pB[4], pC[4];   // the four kept out
vec4 cA, cB, cC;            // the child on the mother's hip
vec3 PP[4];
float PY[4];
vec3 toLocal(vec3 p, int i) { return pfRy(p - PP[i], -PY[i]); }
vec3 childAt() { return personHip(pA[1], pB[1], pC[1], 0.0, 1.0) - pfRy(personPelvis(cA, cB, cC, 5.0), -0.3); }
// person-frame props for the four
float propD(vec3 q, int i, out int pid) {
  pid = 0;
  if (i == 0) { pid = 8; return sdPhone(q, personHand(pA[0], pB[0], pC[0], 1.0, -1.0)); }
  if (i == 1) { pid = 9; return sdPerson3(pfRy(q - childAt(), 0.3), cA, cB, cC, 5.0); }
  if (i == 2) { pid = 7; return sdCup(q, mix(personHand(pA[2], pB[2], pC[2], 0.0, 1.0), personHand(pA[2], pB[2], pC[2], 0.0, -1.0), 0.5)); }
  // a shoulder bag: strap from the left shoulder, the bag at the right hip
  PRig r = personRig(pA[3], pB[3], pC[3], 0.0);
  vec3 bag = r.pel + vec3(0.22, 0.02, 0.04);
  float b = sdRoundBox(q - bag, vec3(0.05, 0.13, 0.15), 0.03);
  b = min(b, sdCapsule(q, r.sR + vec3(0.02, 0.03, 0.0), bag + vec3(0.0, 0.1, 0.0), 0.012));
  pid = 10;
  return b;
}
float mapObj(vec3 p, out int id) {
  id = 1;
  // the wall and its doorway
  float wall = max(max(p.z, -p.z - 0.3), -sdBox(p - vec3(0, DH * 0.5, -0.15), vec3(DW, DH * 0.5, 0.5)));
  wall = max(wall, abs(p.x) - 6.0);
  float d = wall;
  // the chamber's light beyond
  float lb = sdBox(p - vec3(0, 1.4, -1.6), vec3(1.6, 1.8, 0.05));
  if (lb < d) { d = lb; id = 2; }
  // the scan gate standing in the doorway: two chrome posts and a lintel, with ring lights
  vec3 g = p - vec3(0, 0, 0.12);
  float gate = min(sdBox(vec3(abs(g.x) - 0.46, g.y - 1.0, g.z), vec3(0.04, 1.0, 0.06)), sdBox(g - vec3(0, 2.02, 0), vec3(0.5, 0.04, 0.06)));
  if (gate < d) { d = gate; id = 3; }
  // speed-gate cabinets in a row in front of the door, with glass flaps in the lanes
  if (p.z > 0.6 && p.z < 2.2 && p.y < 1.3) {
    float cx = clamp(floor(p.x / 0.8), -3.0, 2.0) + 0.5;
    vec3 c = p - vec3(cx * 0.8, 0.5, 1.4);
    float cab = sdRoundBox(c, vec3(0.1, 0.5, 0.6), 0.03);
    if (cab < d) { d = cab; id = 4; }
    float fx = clamp(floor(p.x / 0.8 + 0.5), -2.0, 2.0) * 0.8;
    vec3 f = p - vec3(fx, 0.75, 1.4);
    float w = 0.05 + 0.25 * uFlap;
    float flap = sdRoundBox(vec3(abs(f.x) - (0.35 - w * 0.5 - 0.02), f.y, f.z), vec3(w * 0.5, 0.2, 0.008), 0.006);
    flap = max(flap, abs(fx) - 2.8);
    if (flap < d) { d = flap; id = 5; }
  } else d = min(d, max(max(p.z - 2.2, 0.6 - p.z), p.y - 1.3) + 0.01);
  if (uShot < 0.5) {
    // the man in the door: inside the gate, arms folded (scaled up a touch: he is tall)
    vec3 q = (p - vec3(0.0, 0.0, 0.14)) / 1.08;
    float m = sdPerson3(q, mA, mB, mC, 4.0) * 1.08;
    if (m < d) { d = m; id = 6; }
  } else if (p.z > 5.8) {
    for (int i = 0; i < 4; i++) {
      vec3 q = toLocal(p, i);
      float k = i == 0 ? 1.0 : 0.0;
      float f = sdPerson3(q, pA[i], pB[i], pC[i], k);
      if (f < d) { d = f; id = 20 + i; }
      if (length(q.xz) < 0.9) {
        int pid;
        float pr = propD(q, i, pid);
        if (pr < d) { d = pr; id = pid; }
      }
    }
  } else d = min(d, 5.8 - p.z + 0.02);
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  vec3 v = normalize(uCamPos - p);
  if (id == 1) {
    Mat m = M(vec3(0.12, 0.12, 0.13) * (0.7 + 0.5 * fbm(p * 2.8, 4)), 0.55, 0.0);
    return dirty(m, p, 1.0);
  }
  if (id == 2) { Mat m = M(vec3(0), 1.0, 0.0); m.emit = vec3(4.2, 3.0, 1.9) * uSwell; return m; }
  vec3 lockC = mix(vec3(0.3, 2.4, 0.5), vec3(3.2, 0.12, 0.3), uLock);
  if (id == 3) {
    Mat m = CHROME(); m.rough = 0.1;
    float ring = smoothstep(0.2, 0.0, abs(fract(p.y * 5.0 - uTime * 1.5 * (1.0 - uLock)) - 0.5) - 0.3);
    m.emit = lockC * ring * step(abs(p.x), 0.43) * 1.2 * (0.25 + 0.75 * uManKey);
    return m;
  }
  if (id == 4) {
    Mat m = M(vec3(0.05, 0.05, 0.06), 0.25, 0.3); m.clear = 1.0;
    m.emit = lockC * 1.4 * smoothstep(0.02, 0.0, abs(p.y - 0.98)) * step(0.9, n.y + 0.5);
    return m;
  }
  if (id == 5) { Mat m = M(vec3(0.05, 0.05, 0.06), 0.05, 0.0); m.clear = 1.0; m.emit = lockC * 0.05; return m; }
  if (id == 6) {
    vec3 q = (p - vec3(0.0, 0.0, 0.14)) / 1.08;
    Mat m = personMat(q, n, v, mA, mB, mC, 4.0, 5.0);
    // a charcoal suit, not a black hole: lift it so the cold key models the shape
    m.alb *= 2.4;
    return m;
  }
  if (id >= 20) {
    int i = id - 20;
    vec3 q = toLocal(p, i);
    vec3 nl = pfRy(n, -PY[i]), vl = pfRy(v, -PY[i]);
    float k = i == 0 ? 1.0 : 0.0;
    Mat m = personMat(q, nl, vl, pA[i], pB[i], pC[i], k, float(i) * 3.0 + 2.0);
    if (gPart != 2) m.alb *= 1.5;
    if (gPart == 1) m.alb = vec3(0.07, 0.08, 0.15);   // dark jeans: never read as skin
    return m;
  }
  if (id == 9) {
    vec3 q = toLocal(p, 1);
    vec3 cq = pfRy(q - childAt(), 0.3);
    return personMat(cq, pfRy(pfRy(n, -PY[1]), 0.3), pfRy(pfRy(v, -PY[1]), 0.3), cA, cB, cC, 5.0, 4.0);
  }
  if (id == 7) { Mat m = M(vec3(0.5, 0.5, 0.48), 0.4, 1.0); return dirty(m, p * 4.0, 0.5); }
  if (id == 10) { Mat m = M(vec3(0.16, 0.09, 0.05), 0.55, 0.0); m.sheen = 0.3; return m; }
  // the phone at 3 %: dark glass, its screen (facing the gate) glowing red
  Mat m = M(vec3(0.02), 0.2, 0.0); m.clear = 1.0;
  vec3 q = toLocal(p, 0);
  vec3 h = personHand(pA[0], pB[0], pC[0], 1.0, -1.0);
  float scr = step(0.0, q.z - h.z - 0.01);
  m.emit = vec3(1.6, 0.06, 0.08) * (0.35 + 0.9 * scr);
  return m;
}
// the barrier lines strung across every lane on the lock, drawn in the plane z = uBarZ
vec3 barrier(vec3 ro, vec3 rd, float depth) {
  if (uBar <= 0.0 || abs(rd.z) < 1e-4) return vec3(0);
  float tz = (uBarZ - ro.z) / rd.z;
  if (tz < 0.0 || tz > depth) return vec3(0);
  vec3 q = ro + rd * tz;
  if (abs(q.x) > uBarX) return vec3(0);
  float w = 0.0022 * tz;
  float l = 0.0;
  for (int i = 0; i < 3; i++) { float y = (0.45 + 0.22 * float(i)) * uBarH; float dy = q.y - y; l += exp(-dy * dy / (w * w)) + 0.08 * exp(-abs(dy) / (w * 5.0)); }
  return vec3(1.0, 0.05, 0.15) * l * uBar;
}
vec3 shade(vec2 fc) {
  personPose(P_FOLD, mA, mB, mC);
  personPose(P_PHONE, pA[0], pB[0], pC[0]);
  personPose(P_MOTHER, pA[1], pB[1], pC[1]);
  personPose(P_OFFER, pA[2], pB[2], pC[2]);
  personPose(P_STAND, pA[3], pB[3], pC[3]);
  personPose(P_CHILD, cA, cB, cC);
  mA.z = 0.0;                     // he looks straight out at you
  mB = vec4(0.3, 1.55, 0.45, 1.6); mC.w = 1.42;   // forearms stacked, not hands meeting
  pB[3].z = 0.0; pB[3].w = 0.5;   // her right hand rests on the bag
  pA[2].z = -0.1;                 // the old man looks up at the gate
  PP[0] = ${pv(0)}; PP[1] = ${pv(1)}; PP[2] = ${pv(2)}; PP[3] = ${pv(3)};
  for (int i = 0; i < 4; i++) PY[i] = atan(-PP[i].x, -PP[i].z) + (i == 0 ? -0.15 : i == 3 ? -0.45 : -0.3);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 c = studio(ro, rd, depth);
  return c + barrier(ro, rd, depth) * uExpo;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('36, 30, 44', 1.0), uCycB: rgb('12, 10, 16', 1.0),
      uFloorCol: rgb('60, 60, 64', 0.8), uFloorRough: 0.06, uFloorGrain: 1.6, uGrime: 0.95,
      uKeyDir: [-0.35, 0.55, 0.75], uKeyCol: [0.9, 0.95, 1.1], uKeySize: 0.4,
      uRimA: [1.2, 0.35, 1.8], uRimB: [0.4, 1.4, 0.6],
      uP1: [0, 1.4, -0.4], uP1c: [6.0, 4.0, 2.2],
      uP2: [0, 1.0, 1.4], uP2c: [0, 0, 0],
      uHaze: 0.07, uHazeCol: rgb('110, 84, 70', 0.45),
      uLock: 0, uFlap: 0, uBar: 0, uSwell: 1, uShot: 0, uBarZ: 1.4, uBarX: 2.8, uManKey: 0, uBarH: 1,
    },
    camera: camera20(P),
    textPlane() { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const B = t >= tOr;
      u.uShot.value = B ? 1 : 0;
      u.uLock.value = t >= tWont - 0.02 ? 1 : 0;
      u.uFlap.value = t < tWont - 0.1 ? 0 : spring(t, tWont - 0.1, 0.22, 0.2);
      const flare = t > tPoor - 0.02 ? 1.6 * Math.exp(-(t - tPoor) * 2.5) : 0;
      u.uBar.value = t < tWont ? 0 : 0.9 + 0.08 * Math.sin(t * 43) + flare;
      // the cut lands in s19's door light: the door burns bright for a beat and settles
      const open = 2.2 * Math.exp(-(t - P.from) * 5);
      const sw = 1 + 0.03 * Math.sin(t * 5.3) + 0.6 * ease.in2((t - (P.to - 1.0)) / 1.0);
      u.uSwell.value = sw + open;
      // the gate lights come up on the man on "stand"
      const mk = 0.12 + 0.88 * ease.out3((t - tStand + 0.04) / 0.18);
      u.uManKey.value = mk;
      if (!B) {
        u.uKeyDir.value = [-0.22, 0.4, 0.9];
        u.uKeyCol.value = [1.5 * mk, 1.65 * mk, 1.95 * mk];
        u.uRimA.value = [1.6, 1.7, 2.0]; u.uRimB.value = [1.6, 1.7, 2.0];
        u.uP1.value = [0, 1.4, -0.4]; u.uP1c.value = [6.0 * sw, 4.0 * sw, 2.2 * sw];
        u.uP2.value = [0, 1.0, 1.4];
        u.uBarZ.value = 1.4; u.uBarX.value = 2.8; u.uBarH.value = 1;
        u.uHaze.value = 0.07;
      } else {
        // the door is behind the camera: its warm spill is the people's key (an unshadowed lamp at
        // the doorway), a cold back light gives the rims, the strips stay low
        u.uKeyDir.value = [-0.5, 1.9, 0.9];
        u.uKeyCol.value = [0.55, 0.7, 1.05];
        u.uRimA.value = [0.5, 0.35, 0.3]; u.uRimB.value = [0.5, 0.35, 0.3];
        u.uP1.value = [0.6, 1.7, 1.2];
        const k = 1.0 + 0.5 * ease.in2((t - (P.to - 1.0)) / 1.0);
        u.uP1c.value = [170 * k, 112 * k, 62 * k];
        u.uP2.value = [0.5, 0.7, BAR_B];
        u.uBarZ.value = BAR_B; u.uBarX.value = 4.5; u.uBarH.value = 0.62;
        u.uHaze.value = 0.025;
      }
      u.uP2c.value = [1.4 * u.uBar.value, 0.05, 0.15 * u.uBar.value];
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.45, bloom: 0.09 }); },
  };
};
