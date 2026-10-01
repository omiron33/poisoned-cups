// v4 readable people (docs/V4-DIRECTION.md 4.3). Include FIGURE_GLSL after STUDIO_GLSL.
//
// Frame: a person stands at the origin facing +z, feet on y = 0, about 1.75 tall (a child 0.55 x).
// Side +1 is the person's left (+x), side -1 the right (-x). Scale per scene: sdPerson(q / s, ...) * s.
//
// Pose: three vec4 (all angles in radians, all 0 = standing at ease, arms hanging):
//   A = (bend, lean, headPitch, shrug)
//       bend   spine curls forward from the pelvis (0.5 = bowed, 1.0 = folded over)
//       lean   the whole body tips forward (+) or back (-) about the feet (rope puller -0.45)
//       head   head pitch on top of the spine: + nods down, - looks up
//       shrug  0..1 shoulders up toward the ears (frozen, flinching)
//   B = (armL pitch, armL elbow, armR pitch, armR elbow)
//       pitch  upper arm measured in the body's (lean) frame: 0 hangs down, 1.57 straight forward,
//              3.1 straight up; negative swings back
//       elbow  0..2.6 forearm folds forward/up from the upper arm's line
//   C = (stride, crouch, kneel, fold)
//       stride -1..1, + puts the left foot forward (walking: stride = sin(phase))
//       crouch 0..1 bends hips and knees (under a load, bracing)
//       kneel  0..1 the right knee goes down to the floor, the left foot planted forward
//       fold   0..1.5 forearms yaw in toward the midline (folded arms, an arm round a child)
//
// GLSL
//   float sdPerson(vec3 q, vec4 A, vec4 B, float kind)            C = 0
//   float sdPerson3(vec3 q, vec4 A, vec4 B, vec4 C, float kind)
//       kind 0 plain, 1 hoodie + backpack, 2 hi-vis vest + hard hat, 3 widow (shawl over head and
//       shoulders, long skirt), 4 sharp suit, 5 child (0.55 scale, bigger head). Bounding capsule
//       first, so it is cheap far away. Sets gPart (0 top, 1 legs, 2 skin, 3 hair, 4 garment, 5 shoes).
//   Mat personMat(vec3 q, vec3 n, vec3 v, vec4 A, vec4 B, vec4 C, float kind, float seed)
//       v = direction to the camera (any frame, same as n). Re-evaluates the body at q and returns matte fabric (charcoal / olive / indigo by seed), warm
//       skin on face and hands, retro-reflective vest stripes that flare toward the camera.
//   vec3 personHand(vec4 A, vec4 B, vec4 C, float kind, float side)   mitten centre (person frame)
//   vec3 personHead(vec4 A, vec4 B, vec4 C, float kind)               head centre
//   vec3 personPelvis(A, B, C, kind), personHip(A, B, C, kind, side)   pelvis; a child's seat on the hip
//   vec3 personBack(vec4 A, vec4 B, vec4 C, float kind)               top of the back (for loads)
//   void personPose(int id, out vec4 A, out vec4 B, out vec4 C)       presets (P_* constants below)
//   props, in the person frame: sdCane(q, hand), sdLoad(q, back, A), sdGlass(q, hand),
//     sdCup(q, hand), sdPhone(q, hand), sdRope(q, a, b, r)
//   crowd: float sdCrowd(vec3 p, vec2 cell, vec2 n, vec4 A, vec4 B, vec4 C, float jit, out vec3 cellInfo)
//       people on a grid of cell size `cell` (x, z), n = (columns, rows) centred on the origin, one
//       person evaluated per cell, hashed height, yaw, kind and pose variation of `jit` (0..1).
//       cellInfo = (hash, kind, cell index) for crowdMat(p, n, v, cell, ncells, A, B, C, jit).
//
// JS: POSES (same presets by name), pose(name) -> { A, B, C }, mixPose(a, b, k), walk(phase, k)
// return poses as plain arrays for uniforms.

export const POSES = {
  stand:     { A: [0, 0, 0.05, 0],        B: [0.05, 0.15, 0.05, 0.15], C: [0, 0, 0, 0] },
  stride:    { A: [0.08, 0.12, 0.05, 0],   B: [-0.55, 0.35, 0.6, 0.55], C: [0.95, 0.08, 0, 0] },      // s09 jaywalker mid-stride
  frozen:    { A: [0.04, -0.06, 0.15, 1.0], B: [0.45, 2.0, 0.45, 2.0],   C: [0.35, 0.18, 0, -0.25] },   // s09 caught, shoulders up
  load:      { A: [0.85, 0.1, -0.7, 0.4], B: [0.55, 2.2, 0.55, 2.2], C: [0.3, 0.3, 0, 0.35] },     // s10 bowed under a load
  buckle:    { A: [0.95, 0.12, -0.35, 0.7], B: [1.2, 0.2, 2.2, 2.2],   C: [0.15, 0.75, 0.35, 0.0] },  // s10 buckling, one hand down
  widow:     { A: [0.5, 0.05, -0.2, 0.25], B: [1.45, 0.25, 0.42, 0.05], C: [0.2, 0.22, 0, 0] },      // s11 bent on a cane (R), L hand at the slot
  toast:     { A: [-0.08, -0.05, -0.2, 0], B: [0.15, 0.2, 1.45, 1.35],  C: [0.1, 0, 0, 0.15] },     // s11 rich man, raised glass (R)
  lookup:    { A: [-0.08, -0.04, -0.62, 0], B: [0.05, 0.25, 0.05, 0.25], C: [0, 0, 0, 0] },        // s17 crowd looking up
  fold:      { A: [-0.05, -0.03, 0.05, 0.1], B: [0.35, 1.75, 0.35, 1.75], C: [0, 0, 0, 1.25] },    // s20 arms folded in a doorway
  mother:    { A: [-0.02, -0.03, 0.15, 0], B: [0.15, 1.45, 0.15, 0.35], C: [0.1, 0, 0, 0.1] },     // s20 child on her left hip
  child:     { A: [0.05, 0, -0.1, 0],      B: [1.5, 0.5, 0.9, 0.9],     C: [0, 1.0, 0, 0.5] },      // s20 the child held on the hip
  offer:     { A: [0.28, 0.04, 0.05, 0.15], B: [1.25, 0.35, 1.2, 0.45], C: [0.2, 0.15, 0, 0.45] },  // s20 old man holding out a cup
  phone:     { A: [-0.04, -0.02, -0.3, 0], B: [0.1, 0.25, 1.95, 0.55], C: [0.15, 0, 0, 0.2] },   // s20 young man holding up a phone (R)
  kneel:     { A: [0.72, 0.05, 0.75, 0.3], B: [1.0, 0.0, 0.3, 0.6],    C: [0, 0, 1, 0] },          // s23 kneeling, hand on the floor, head bowed
  kneelUp:   { A: [0.35, 0.0, -0.55, 0],   B: [1.0, 0.05, 0.3, 0.6],   C: [0, 0, 1, 0] },          // s23 head lifting to the light
  walk:      { A: [0.05, 0.06, 0.0, 0],    B: [-0.4, 0.3, 0.45, 0.4],   C: [0.7, 0.05, 0, 0] },     // s24 walking in
  throw:     { A: [-0.22, -0.16, -0.35, 0], B: [1.2, 0.3, 2.6, 0.9], C: [0.85, 0.15, 0, 0] },  // s24 throwing a cable overhand (R)
  pull:      { A: [0.12, -0.5, -0.1, 0.1], B: [1.15, 0.35, 1.3, 0.25], C: [0.75, 0.42, 0, 0.12] }, // s25 leaning back on a rope
};
export const POSE_IDS = Object.keys(POSES);   // GLSL personPose(id) uses this order
export const pose = (name) => POSES[name];
export function mixPose(a, b, k) {
  const m = (x, y) => x.map((v, i) => v + (y[i] - v) * k);
  return { A: m(a.A, b.A), B: m(a.B, b.B), C: m(a.C, b.C) };
}
// a walk cycle: phase in radians (2 pi per two steps), k = stride size 0..1
export function walk(phase, k = 1) {
  const s = Math.sin(phase);
  return { A: [0.05, 0.06, 0.0, 0], B: [-0.45 * s * k, 0.3, 0.45 * s * k, 0.3], C: [0.8 * s * k, 0.05 + 0.04 * Math.abs(Math.cos(phase)), 0, 0] };
}

const v4 = (a) => `vec4(${a.map((x) => x.toFixed(3)).join(', ')})`;
const presets = POSE_IDS.map((n, i) => `  if (id == ${i}) { A = ${v4(POSES[n].A)}; B = ${v4(POSES[n].B)}; C = ${v4(POSES[n].C)}; return; }`).join('\n');
const consts = POSE_IDS.map((n, i) => `const int P_${n.toUpperCase()} = ${i};`).join('\n');

export const FIGURE_GLSL = /* glsl */ `
${consts}
void personPose(int id, out vec4 A, out vec4 B, out vec4 C) {
  A = vec4(0); B = vec4(0); C = vec4(0);
${presets}
}
int gPart = 0;
// rotate in the yz plane: +a tips +y toward +z
vec3 pfRx(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
// rotate about y: +a turns +z toward +x
vec3 pfRy(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }

struct PRig { vec3 pel, wai, che, nek, hed, sL, eL, hL, sR, eR, hR, kL, aL, kR, aR; float bend, hp; };

void pfLeg(float side, vec4 C, float sc, out vec2 th) {
  // returns (thigh angle from vertical, forward +; knee bend) for one leg
  float st = C.x * side;
  float t = st * 0.42 + C.y * 0.95;
  float k = C.y * 1.75 + 0.35 * max(-st, 0.0) + 0.08;
  // kneel: right leg knee down, left foot planted forward
  vec2 kn = side < 0.0 ? vec2(0.05, 1.62) : vec2(1.42, 1.52);
  th = mix(vec2(t, k), kn, C.z);
}
PRig personRig(vec4 A, vec4 B, vec4 C, float kind) {
  PRig r;
  float lt = 0.45, ls = 0.44;
  vec2 tl, tr;
  pfLeg(1.0, C, 1.0, tl); pfLeg(-1.0, C, 1.0, tr);
  // knee and ankle offsets below the hip (in yz), ankle 0.07 above the floor
  vec3 kL = vec3(0, -cos(tl.x), sin(tl.x)) * lt, kR = vec3(0, -cos(tr.x), sin(tr.x)) * lt;
  vec3 aL = kL + vec3(0, -cos(tl.x - tl.y), sin(tl.x - tl.y)) * ls;
  vec3 aR = kR + vec3(0, -cos(tr.x - tr.y), sin(tr.x - tr.y)) * ls;
  // the pelvis sits so the lowest foot (or the kneeling knee) touches the floor
  float low = max(-min(aL.y, kL.y + 0.02), -min(aR.y, mix(aR.y, kR.y + 0.02, C.z)));
  float py = low + 0.075;
  r.pel = vec3(0, py, -0.25 * (aL.z + aR.z) * (1.0 - C.z) - 0.1 * C.z);
  vec3 hipL = r.pel + vec3(0.1, -0.02, 0), hipR = r.pel + vec3(-0.1, -0.02, 0);
  r.kL = hipL + kL; r.aL = hipL + aL; r.kR = hipR + kR; r.aR = hipR + aR;
  // spine: the lower back bends less than the upper
  float b = A.x;
  r.bend = b;
  r.wai = r.pel + pfRx(vec3(0, 0.2, 0), b * 0.45);
  r.che = r.wai + pfRx(vec3(0, 0.27, 0), b * 0.9);
  float sh = A.w * 0.07;
  r.nek = r.che + pfRx(vec3(0, 0.15 - sh * 0.6, 0.0), b * 1.05);
  r.hp = b * 1.05 + A.z;
  r.hed = r.nek + pfRx(vec3(0, 0.13, 0.025), r.hp);
  vec3 sBase = r.che + pfRx(vec3(0, 0.1 + sh, -0.01), b);
  float sw = kind > 3.5 && kind < 4.5 ? 0.2 : 0.18;
  r.sL = sBase + vec3(sw, 0, 0); r.sR = sBase - vec3(sw, 0, 0);
  // arms: pitch from hanging down, elbow folds forward, fold yaws the forearm to the midline
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? 1.0 : -1.0;
    float pa = i == 0 ? B.x : B.z, el = i == 0 ? B.y : B.w;
    vec3 s = i == 0 ? r.sL : r.sR;
    float ab = 0.1 + 0.08 * A.w;
    vec3 ud = normalize(vec3(side * ab, -cos(pa), sin(pa)));
    vec3 e = s + ud * 0.29;
    vec3 fd = normalize(vec3(side * ab * 0.5, -cos(pa + el), sin(pa + el)));
    fd = pfRy(fd, -side * C.w);
    vec3 h = e + fd * 0.25;
    if (i == 0) { r.eL = e; r.hL = h; } else { r.eR = e; r.hR = h; }
  }
  return r;
}
// lean tips the whole body about the feet (positions above are in the leaned frame)
vec3 pfLean(vec3 v, float lean) { return pfRx(v, lean); }

float pfLimb(vec3 q, vec3 a, vec3 b, float ra, float rb) { return sdRoundCone(q, a, b, ra, rb); }

float sdPersonRig(vec3 q, PRig r, vec4 A, vec4 C, float kind) {
  bool child = kind > 4.5;
  float hs = child ? 1.32 : 1.0;
  // the head frame
  vec3 hq = pfRx(q - r.hed, -r.hp);
  float head = sdEllipsoid(hq, vec3(0.094, 0.118, 0.104) * hs);
  head = smin(head, sdEllipsoid(hq - vec3(0, -0.06, 0.04) * hs, vec3(0.062, 0.06, 0.07) * hs), 0.03);   // jaw
  float nose = sdEllipsoid(hq - vec3(0, -0.01, 0.1) * hs, vec3(0.017, 0.03, 0.022) * hs);
  head = smin(head, nose, 0.012);
  float neck = sdCapsule(q, r.che + pfRx(vec3(0, 0.08, 0), r.bend), r.hed - pfRx(vec3(0, 0.07, 0.01), r.hp), 0.052);
  // torso: ribcage, waist, pelvis
  vec3 cq = pfRx(q - r.che, -r.bend);
  float sw = kind > 3.5 && kind < 4.5 ? 1.08 : 1.0;
  float chest = sdEllipsoid(cq - vec3(0, 0.02, 0.0), vec3(0.185 * sw, 0.18, 0.125));
  chest = smin(chest, sdCapsule(q, r.sL, r.sR, 0.065), 0.07);
  float waist = sdEllipsoid(pfRx(q - r.wai, -r.bend * 0.45), vec3(0.155, 0.14, 0.11));
  float pelv = sdEllipsoid(q - r.pel - vec3(0, 0.0, -0.01), vec3(0.17, 0.125, 0.115));
  float torso = smin(smin(chest, waist, 0.12), pelv, 0.1);
  gPart = 0;
  float d = torso;
  float hd = smin(head, neck, 0.04);
  // arms: upper arm, forearm, mitten hand (no fingers)
  float arm = min(pfLimb(q, r.sL, r.eL, 0.06, 0.048), pfLimb(q, r.sR, r.eR, 0.06, 0.048));
  arm = min(arm, min(pfLimb(q, r.eL, r.hL, 0.045, 0.036), pfLimb(q, r.eR, r.hR, 0.045, 0.036)));
  vec3 fL = normalize(r.hL - r.eL), fR = normalize(r.hR - r.eR);
  float hand = min(sdCapsule(q, r.hL + fL * 0.025, r.hL + fL * 0.085, 0.038), sdCapsule(q, r.hR + fR * 0.025, r.hR + fR * 0.085, 0.038));
  // legs
  vec3 hipL = r.pel + vec3(0.095, -0.03, 0), hipR = r.pel + vec3(-0.095, -0.03, 0);
  float leg = min(pfLimb(q, hipL, r.kL, 0.095, 0.066), pfLimb(q, hipR, r.kR, 0.095, 0.066));
  leg = min(leg, min(pfLimb(q, r.kL, r.aL, 0.064, 0.044), pfLimb(q, r.kR, r.aR, 0.064, 0.044)));
  // feet point along the shin's forward direction, flat-ish
  vec3 dL = normalize(vec3(0, 0, 1) + vec3(0, -0.3, 0) * 0.0), dR = dL;
  float kneeDown = C.z;
  vec3 dRk = normalize(mix(dR, normalize(r.aR - r.kR) + vec3(0, -0.2, 0), kneeDown));
  float foot = min(sdCapsule(q, r.aL + vec3(0, -0.03, -0.03), r.aL + vec3(0, -0.04, 0.0) + dL * 0.15, 0.042),
                   sdCapsule(q, r.aR + vec3(0, -0.03, -0.03) * (1.0 - kneeDown), r.aR + mix(vec3(0, -0.04, 0.0) + dR * 0.15, dRk * 0.14, kneeDown), 0.042));
  d = smin(d, arm, 0.05);
  float lw = smin(leg, torso, 0.06);
  // garments
  float gar = 1e9;
  if (kind > 0.5 && kind < 1.5) {
    // hoodie: the hood bunched behind the neck, a backpack on the shoulder blades
    gar = sdEllipsoid(pfRx(q - r.nek, -r.bend) - vec3(0, 0.0, -0.08), vec3(0.12, 0.08, 0.07));
    gar = min(gar, sdRoundBox(cq - vec3(0, -0.02, -0.17), vec3(0.15, 0.2, 0.08), 0.05));
  } else if (kind > 1.5 && kind < 2.5) {
    // hard hat: a dome with a brim; vest is a slightly thicker shell on the chest (material marks it)
    vec3 hh = hq - vec3(0, 0.055, 0.0);
    float dome = max(sdEllipsoid(hh, vec3(0.108, 0.095, 0.122)), -hh.y);
    float brim = sdCyl(hh - vec3(0, 0.004, 0.02), 0.135, 0.006) - 0.004;
    brim = max(brim, -(hh.z + 0.06));
    gar = min(dome, brim);
    float vest = chest - 0.016;
    vest = smin(vest, sdEllipsoid(pfRx(q - r.wai, -r.bend * 0.45), vec3(0.155, 0.14, 0.11)) - 0.016, 0.1);
    vest = max(vest, dot(q - r.wai, pfRx(vec3(0, -1, 0), r.bend * 0.45)) - 0.02);
    gar = min(gar, vest);
  } else if (kind > 2.5 && kind < 3.5) {
    // widow: shawl over the head (open at the face) and draped over the shoulders; long skirt
    vec3 sq = hq - vec3(0, 0.014, -0.014);
    float hood = sdEllipsoid(sq, vec3(0.106, 0.128, 0.116));
    hood = max(hood, -sdEllipsoid(sq - vec3(0, -0.035, 0.105), vec3(0.075, 0.105, 0.085)));
    vec3 tq = cq - vec3(0, 0.1, -0.01);
    float cape = sdEllipsoid(tq, vec3(0.255, 0.17, 0.16));
    cape = max(cape, -tq.y - 0.11);
    gar = smin(hood, cape, 0.05);
    float sk = sdRoundCone(q, r.pel + vec3(0, -0.85 + r.pel.y * 0.0, 0.02), r.pel + vec3(0, 0.05, 0), 0.27, 0.16);
    sk = max(sk, -q.y + 0.06);
    gar = min(gar, sk);
  } else if (kind > 3.5 && kind < 4.5) {
    // suit: squared shoulder pads and a jacket hem
    gar = sdRoundBox(cq - vec3(0, 0.08, 0.0), vec3(0.2, 0.06, 0.1), 0.05);
    float hem = sdEllipsoid(pfRx(q - r.wai, -r.bend * 0.45) - vec3(0, -0.04, 0.0), vec3(0.165, 0.17, 0.12));
    gar = smin(gar, hem, 0.05);
  }
  // hair on adults without a hat or shawl
  float hair = 1e9;
  if (kind < 1.5 || kind > 3.5) hair = sdEllipsoid(hq - vec3(0, 0.03, -0.018) * hs, vec3(0.093, 0.105, 0.098) * hs);
  if (kind > 0.5 && kind < 1.5) {
    // hoodie: the hood is up, over the hair
    vec3 sq = hq - vec3(0, 0.015, -0.02);
    hair = 1e9;
    float hood = sdEllipsoid(sq, vec3(0.112, 0.128, 0.118));
    hood = max(hood, -sdEllipsoid(sq - vec3(0, -0.03, 0.1), vec3(0.078, 0.1, 0.075)));
    gar = min(gar, hood);
  }
  // combine, and label the nearest part (garments and hair win ties)
  float body = smin(smin(smin(d, lw, 0.03), hd, 0.03), hand, 0.03);
  body = smin(body, foot, 0.03);
  int part = 0;
  float best = min(torso, arm);
  if (leg < best - 0.006) { part = 1; best = leg; }
  if (hd < best) { part = 2; best = hd; }
  if (hand < best + 0.004) { part = 2; best = min(best, hand); }
  if (foot < best + 0.004) { part = 5; best = min(best, foot); }
  if (hair < body + 0.004) part = 3;
  body = min(body, hair);
  if (gar < body + 0.003) part = 4;
  body = min(body, gar);
  gPart = part;
  return body;
}

float sdPerson3(vec3 q, vec4 A, vec4 B, vec4 C, float kind) {
  float s = kind > 4.5 ? 0.55 : 1.0;
  q /= s;
  // bounding capsule: covers arms overhead and a deep bow
  float bb = sdCapsule(q, vec3(0, 0.45, 0), vec3(0, 1.55, 0), 0.92);
  if (bb > 0.25) { gPart = 0; return (bb - 0.1) * s; }
  q = pfRx(q, -A.y);
  PRig r = personRig(A, B, C, kind);
  return sdPersonRig(q, r, A, C, kind) * s;
}
float sdPerson(vec3 q, vec4 A, vec4 B, float kind) { return sdPerson3(q, A, B, vec4(0), kind); }

// joint positions in the person frame (scaled for a child)
vec3 personHand(vec4 A, vec4 B, vec4 C, float kind, float side) {
  float s = kind > 4.5 ? 0.55 : 1.0;
  PRig r = personRig(A, B, C, kind);
  vec3 h = side > 0.0 ? r.hL + normalize(r.hL - r.eL) * 0.06 : r.hR + normalize(r.hR - r.eR) * 0.06;
  return pfRx(h, A.y) * s;
}
vec3 personHead(vec4 A, vec4 B, vec4 C, float kind) {
  float s = kind > 4.5 ? 0.55 : 1.0;
  return pfRx(personRig(A, B, C, kind).hed, A.y) * s;
}
vec3 personPelvis(vec4 A, vec4 B, vec4 C, float kind) {
  float s = kind > 4.5 ? 0.55 : 1.0;
  return pfRx(personRig(A, B, C, kind).pel, A.y) * s;
}
// where a child sits on this person's hip (side +1 left): place the child (kind 5) so its pelvis is here
vec3 personHip(vec4 A, vec4 B, vec4 C, float kind, float side) {
  float s = kind > 4.5 ? 0.55 : 1.0;
  return pfRx(personRig(A, B, C, kind).pel + vec3(side * 0.23, 0.2, 0.07), A.y) * s;
}
vec3 personBack(vec4 A, vec4 B, vec4 C, float kind) {
  float s = kind > 4.5 ? 0.55 : 1.0;
  PRig r = personRig(A, B, C, kind);
  return pfRx(r.che + pfRx(vec3(0, 0.12, -0.14), r.bend), A.y) * s;
}

// props in the person frame
float sdCane(vec3 q, vec3 hand) {
  vec3 foot = vec3(hand.x + 0.03, 0.0, hand.z + 0.06);
  float shaft = sdCapsule(q, foot, hand + vec3(0, 0.02, 0), 0.014);
  float crook = sdTorus((q - hand - vec3(0, 0.05, -0.04)).yzx, vec2(0.045, 0.013));
  crook = max(crook, -(q.y - hand.y - 0.05));
  return min(shaft, crook);
}
// a stack of crates / cases strapped on a bowed back; A for the bend
float sdLoad(vec3 q, vec3 back, vec4 A, float n) {
  // the stack runs along the spine, resting on the back from the waist up and towering over the head
  vec3 l = pfRx(q - back, -(A.x * 0.9 + A.y));
  float d = 1e9;
  for (int i = 0; i < 3; i++) {
    if (float(i) >= n) break;
    vec3 c = l - vec3(0.02 * sin(float(i) * 2.3), -0.22 + float(i) * 0.235, -0.16);
    c.xz = rot(0.1 * sin(float(i) * 3.1)) * c.xz;
    d = min(d, sdRoundBox(c, vec3(0.24, 0.11, 0.18), 0.015));
  }
  return d;
}
float sdGlass(vec3 q, vec3 hand) {
  vec3 g = q - hand - vec3(0, 0.07, 0.0);
  float bowl = max(sdEllipsoid(g - vec3(0, 0.03, 0), vec3(0.045, 0.06, 0.045)), g.y - 0.06);
  bowl = max(bowl, -sdEllipsoid(g - vec3(0, 0.035, 0), vec3(0.04, 0.055, 0.04)));
  float stem = sdCapsule(g, vec3(0, -0.07, 0), vec3(0, -0.02, 0), 0.006);
  return min(bowl, stem);
}
float sdCup(vec3 q, vec3 hand) {
  vec3 c = q - hand - vec3(0, 0.05, 0.03);
  float d = sdCyl(c, 0.05, 0.05) - 0.005;
  return max(d, -sdCyl(c - vec3(0, 0.03, 0), 0.042, 0.05));
}
float sdPhone(vec3 q, vec3 hand) {
  vec3 c = q - hand - vec3(0, 0.08, 0.01);
  return sdRoundBox(c, vec3(0.04, 0.08, 0.006), 0.006);
}
float sdRope(vec3 q, vec3 a, vec3 b, float r) { return sdCapsule(q, a, b, r); }

// skin tones (linear): tan to deep brown
vec3 skinTone(float h) { return mix(vec3(0.58, 0.34, 0.21), vec3(0.24, 0.12, 0.065), h); }
Mat personMat(vec3 q, vec3 n, vec3 v, vec4 A, vec4 B, vec4 C, float kind, float seed) {
  sdPerson3(q, A, B, C, kind);
  int part = gPart;
  float s = kind > 4.5 ? 0.55 : 1.0;
  vec3 lq = pfRx(q / s, -A.y);
  float h = hash11(seed * 7.13 + 1.7);
  // fabric: charcoal, olive or indigo, matte with a weave
  vec3 cloth = h < 0.33 ? vec3(0.1, 0.1, 0.11) : h < 0.66 ? vec3(0.13, 0.14, 0.06) : vec3(0.06, 0.07, 0.17);
  if (kind > 4.5) cloth = vec3(0.32, 0.31, 0.34);   // a child in pale grey, so it separates from the adult
  float weave = 0.85 + 0.15 * vnoise(q.xy * 220.0 + q.z * 90.0);
  Mat m = M(cloth * weave, 0.82, 0.0);
  m.sheen = 0.35;
  if (part == 1) { m.alb = (h < 0.5 ? vec3(0.05, 0.055, 0.08) : vec3(0.1, 0.09, 0.075)) * weave; }
  if (part == 2) {
    m = M(skinTone(hash11(seed * 3.7 + 0.3)), 0.5, 0.0);
    m.sheen = 0.25;
    m.emit = m.alb * vec3(1.0, 0.55, 0.35) * 0.045;   // a touch of warmth so faces never go black
  }
  if (part == 3) { m = M(vec3(0.02, 0.016, 0.014), 0.6, 0.0); m.sheen = 0.6; if (kind > 0.5 && kind < 1.5) { m = M(cloth * weave * 1.1, 0.82, 0.0); m.sheen = 0.35; } }
  if (part == 5) { m = M(vec3(0.02, 0.02, 0.022), 0.45, 0.0); m.clear = 0.3; }
  if (part == 4) {
    if (kind > 0.5 && kind < 1.5) { m = M(cloth * weave * 1.1, 0.82, 0.0); m.sheen = 0.35; if (lq.z < personRig(A, B, C, kind).che.z - 0.06) m.alb = vec3(0.02, 0.022, 0.025); }
    else if (kind > 1.5 && kind < 2.5) {
      PRig r = personRig(A, B, C, kind);
      bool hat = length(lq - r.hed) < 0.16;
      // fluorescent lime vest (toxic green family), hat in the same safety colour
      m = M(vec3(0.55, 0.85, 0.04), 0.6, 0.0);
      m.emit = vec3(0.55, 0.85, 0.04) * 0.06;
      if (!hat) {
        vec3 cq = pfRx(lq - r.che, -r.bend);
        float band = min(abs(cq.y + 0.1), abs(cq.y - 0.04));
        float brace = abs(abs(cq.x) - 0.09) * step(0.0, cq.y + 0.12);
        float st = step(band, 0.018) + step(brace, 0.016) * step(-0.1, cq.y);
        if (st > 0.5) {
          m = M(vec3(0.6, 0.62, 0.64), 0.35, 0.3);
          m.emit = vec3(0.85, 0.9, 1.0) * (0.15 + 1.6 * pow(sat(dot(n, v)), 3.0));
        }
      } else { m.rough = 0.3; m.clear = 0.6; m.emit *= 0.5; }
    }
    else if (kind > 2.5 && kind < 3.5) {
      // the widow's shawl: a dusty violet wool, the skirt darker
      m = M(vec3(0.2, 0.12, 0.2) * weave, 0.88, 0.0); m.sheen = 0.7;
      if (lq.y < personRig(A, B, C, kind).wai.y - 0.05) m.alb = vec3(0.07, 0.06, 0.085) * weave;
    }
    else { m = M(vec3(0.025, 0.026, 0.03) * weave, 0.6, 0.0); m.sheen = 0.5; }
  }
  // suit: white shirt V and a dark tie on the chest
  if (kind > 3.5 && kind < 4.5 && (part == 0 || part == 4)) {
    PRig r = personRig(A, B, C, kind);
    vec3 cq = pfRx(lq - r.che, -r.bend);
    m = M(vec3(0.025, 0.026, 0.03) * weave, 0.6, 0.0); m.sheen = 0.5;
    float vee = step(abs(cq.x), 0.05 * sat((cq.y + 0.02) / 0.16)) * step(-0.02, cq.y) * step(0.0, cq.z);
    if (vee > 0.5) { m = M(vec3(0.7, 0.72, 0.75), 0.5, 0.0); if (abs(cq.x) < 0.012) m.alb = vec3(0.05, 0.01, 0.03); }
  }
  return m;
}

// a cheap crowd: one person per grid cell, hashed variation
float sdCrowd(vec3 p, vec2 cell, vec2 n, vec4 A, vec4 B, vec4 C, float jit, out vec3 info) {
  vec2 id = clamp(floor(p.xz / cell + 0.5), -floor(n * 0.5), ceil(n * 0.5) - 1.0);
  vec2 c = id * cell;
  float h = hash12(id + 13.1);
  vec3 q = p - vec3(c.x + (hash12(id + 2.7) - 0.5) * cell.x * 0.3 * jit, 0, c.y + (hash12(id + 5.3) - 0.5) * cell.y * 0.3 * jit);
  q = pfRy(q, (hash12(id + 9.1) - 0.5) * 0.9 * jit);
  float sc = 0.9 + 0.18 * hash12(id + 4.4);
  float kind = h < 0.35 ? 0.0 : h < 0.6 ? 1.0 : h < 0.8 ? 2.0 : h < 0.9 ? 4.0 : 3.0;
  vec4 a = A + vec4(0.08, 0.04, 0.25, 0) * (hash12(id + 8.0) - 0.5) * jit;
  vec4 b = B + vec4(0.4, 0.5, 0.4, 0.5) * (vec4(hash12(id + 1.0), hash12(id + 2.0), hash12(id + 3.0), hash12(id + 4.0)) - 0.5) * jit;
  vec4 cc = C + vec4(0.5 * (hash12(id + 6.0) - 0.5) * jit, 0, 0, 0);
  info = vec3(h, kind, id.x * 101.0 + id.y);
  float d = sdPerson3(q / sc, a, b, cc, kind) * sc;
  // never step past the cell edge (the neighbour was not evaluated)
  vec2 e = cell * 0.5 - abs(p.xz - c);
  return min(d, max(min(e.x, e.y), 0.0) + 0.05);
}
Mat crowdMat(vec3 p, vec3 n, vec3 v, vec2 cell, vec2 ncell, vec4 A, vec4 B, vec4 C, float jit) {
  vec2 id = clamp(floor(p.xz / cell + 0.5), -floor(ncell * 0.5), ceil(ncell * 0.5) - 1.0);
  vec2 c = id * cell;
  float h = hash12(id + 13.1);
  vec3 q = p - vec3(c.x + (hash12(id + 2.7) - 0.5) * cell.x * 0.3 * jit, 0, c.y + (hash12(id + 5.3) - 0.5) * cell.y * 0.3 * jit);
  q = pfRy(q, (hash12(id + 9.1) - 0.5) * 0.9 * jit);
  float sc = 0.9 + 0.18 * hash12(id + 4.4);
  float kind = h < 0.35 ? 0.0 : h < 0.6 ? 1.0 : h < 0.8 ? 2.0 : h < 0.9 ? 4.0 : 3.0;
  vec4 a = A + vec4(0.08, 0.04, 0.25, 0) * (hash12(id + 8.0) - 0.5) * jit;
  vec4 b = B + vec4(0.4, 0.5, 0.4, 0.5) * (vec4(hash12(id + 1.0), hash12(id + 2.0), hash12(id + 3.0), hash12(id + 4.0)) - 0.5) * jit;
  vec4 cc = C + vec4(0.5 * (hash12(id + 6.0) - 0.5) * jit, 0, 0, 0);
  return personMat(q / sc, n, v, a, b, cc, kind, h * 31.0);
}
`;
