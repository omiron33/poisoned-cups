// 13 · "Brood of vipers / Who warned you from the fire?"  (v2, hook rung 3: the gate overheats)
// The access gate from s12, seen head on down its neon corridor: two steel gate pillars with a
// lintel, a lattice of laser geometry strung between them, amber warning beacons. The corridor is
// overheating. v4: a real snake (lib/x-v4-snake.js wrap) winds up each pillar, climbing as the line
// goes on, its head rearing off the top, jaws parted, tongue flicking; on "fire?" both heads strike
// toward the camera at full gape, fangs out, and the snap zoom lands on the open mouths. Judgment runs DOWN the circuitry: the pillars' traces go white-hot from the
// lintel downward, the floor under the gate glows, the lattice burns from red to white. A reveal
// tilt climbs with the vipers; punches on the kicks; a hard snap zoom on "fire?".
import { ease, grade, rgb, linesAt, clamp01, spring, mix } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { XB_GLSL } from '/song/lib/x-b.js';
import { SNAKE_GLSL } from '/song/lib/x-v4-snake.js';
import { S13_GLSL } from '/song/lib/x-v4s-s13.js';

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const tB = L1.words[0].start, tV = L1.words[2].start, tW = L2.words[0].start, tF = L2.words[L2.words.length - 1].start;
  // climb: how high the vipers have wound (a slither that surges on each kick)
  const climbAt = (t) => 0.35 + 0.5 * spring(t, tB, 0.6, 0.15) + 0.45 * spring(t, tV, 0.6, 0.15) + 0.45 * ease.inOut3((t - tW) / 1.4) + 0.2 * spring(t, tF, 0.4, 0.2);
  const heatAt = (t) => clamp01(0.15 + 0.3 * ease.inOut3((t - t0) / (tF - t0)) + 0.55 * ease.out5((t - tF + 0.03) / 0.4));
  const tearAt = (t) => [tB, tV, tF].reduce((a, h) => Math.max(a, t >= h && t < h + 0.1 ? 1 - (t - h) / 0.1 : 0), 0);
  const camera = (t) => {
    const u = t - t0;
    const tilt = ease.inOut3(u / 3.6);
    const pB = spring(t, tB - 0.02, 0.35, 0.3), pV = spring(t, tV - 0.02, 0.35, 0.3);
    const zf = spring(t, tF - 0.03, 0.35, 0.2);
    const d = 0.008 * (Math.sin(t * 0.9) + 0.5 * Math.sin(t * 2.3 + 1.0));
    return {
      pos: [0.15 + d, 0.45 + 0.25 * tilt, 4.3 - 0.35 * pB - 0.35 * pV - 0.4 * tilt],
      target: [0.0 + d, mix(mix(0.9, 1.75, tilt), 2.1, zf), mix(0.0, 0.45, zf)],
      fov: mix(44, 32, zf), roll: -0.01 + 0.02 * pV - 0.025 * zf,
    };
  };
  return {
    name: 's13-vipers2', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + VIPER_GLSL + XB_GLSL + SNAKE_GLSL + S13_GLSL + /* glsl */ `
uniform float uClimb, uHeat, uTear, uStrike;
const float PX = 0.95, PR = 0.2, PH = 3.0;
float pillar(vec3 p) {
  vec3 q = vec3(abs(p.x) - PX, p.y, p.z);
  float d = sdCyl(q - vec3(0.0, PH * 0.5, 0.0), PR, PH * 0.5);
  d = min(d, sdRoundBox(q - vec3(0.0, 0.08, 0.0), vec3(0.3, 0.08, 0.3), 0.01));
  return d;
}
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = pillar(p);
  float v = sdRoundBox(p - vec3(0.0, PH + 0.12, 0.0), vec3(PX + 0.35, 0.14, 0.28), 0.01); if (v < d) { d = v; id = 3; }
  // the corridor walls, far back, with neon strips
  v = abs(abs(p.x) - 2.7) - 0.05; if (v < d) { d = v; id = 4; }
  float b = length(vec2(abs(p.x) - PX, p.z)) - 1.1;
  if (b > 0.3) return min(d, b);
  float T = uTime;
  // one snake round each pillar, climbing (the helix turns as it climbs so the head stays aimed at
  // the camera); the right one wound the other way round. On "fire?" both strike at full gape.
  float y1 = min(uClimb, 2.6);
  float gp = mix(0.3, 1.0, uStrike);
  float H = 0.62, th = (y1 - 0.05) / H * 6.2831853;
  vec3 q = p - vec3(-PX, 0.0, 0.0);
  v = snakeWrapStrike(q, vec3(0.0), PR, 0.08, H, 0.05, y1, 1.35 - th, 0.4, gp, uStrike); if (v < d) { d = v; id = 1; keepSnake(); }
  q = p - vec3(PX, 0.0, 0.0); q.x = -q.x;
  float H2 = 0.56, th2 = (y1 * 0.94 - 0.05) / H2 * 6.2831853;
  v = snakeWrapStrike(q, vec3(0.0), PR, 0.075, H2, 0.05, y1 * 0.94, 1.35 - th2, 0.38, gp, uStrike); if (v < d) { d = v; id = 1; keepSnake(); }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = snakeMat(p, n, 0.0);
    // the heat runs down the spine as the gate overheats
    float fr = pow(1.0 - sat(dot(n, normalize(uCamPos - p))), 3.0);
    m.emit += vec3(0.5, 0.25, 0.6) * fr * 0.8 + vec3(2.2, 0.5, 0.08) * uHeat * uHeat * fr * 0.6;
    return m;
  }
  if (id == 4) {
    Mat m = M(vec3(0.05, 0.05, 0.06), 0.4, 0.0);
    float strip = smoothstep(0.02, 0.0, abs(p.y - 2.2)) + smoothstep(0.02, 0.0, abs(p.y - 0.25));
    m.emit = mix(vec3(1.2, 0.2, 2.2), vec3(3.0, 0.6, 0.3), uHeat) * strip * 1.2;
    return dirty(m, p, 0.8);
  }
  Mat m = M(vec3(0.55, 0.56, 0.6), 0.28, 1.0);
  m.rough += 0.2 * fbm(p * vec3(30.0, 4.0, 30.0), 3);
  // circuit traces down the pillars: vertical runs with jogs, heating from the top down
  float a = atan(p.z, abs(p.x) - PX);
  vec2 cu = vec2(a * 3.0, p.y * 2.5);
  vec2 cid = floor(cu);
  float h = hash12(cid);
  vec2 f = fract(cu);
  float run = smoothstep(0.06, 0.02, abs(f.x - 0.2 - 0.6 * h)) * step(0.15, hash12(cid + 3.1));
  float jog = smoothstep(0.06, 0.02, abs(f.y - 0.5)) * step(0.7, h) * step(f.x, 0.2 + 0.6 * h + 0.03) * step(0.2, f.x);
  float trace = max(run, jog) * (id == 2 ? 1.0 : 0.0);
  float front = PH + 0.3 - uHeat * (PH + 0.6);   // the heat front moves down
  float hot = smoothstep(front - 0.25, front + 0.1, p.y);
  m.emit = trace * mix(vec3(0.3, 1.6, 0.4) * 0.5, vec3(4.0, 1.4, 0.3) + vec3(3.0, 2.6, 2.0) * uHeat, hot);
  // amber warning beacons: two on each pillar and one on the lintel, pulsing
  float bp = step(0.5, fract(uTime * 2.2));
  vec3 bq = vec3(abs(p.x) - PX, p.y, p.z);
  float bc = smoothstep(0.06, 0.03, length(vec2(bq.y - 2.55, bq.x))) * step(0.1, p.z);
  bc += smoothstep(0.05, 0.025, length(vec2(bq.y - 1.3, bq.x))) * step(0.1, p.z);
  m.emit += vec3(5.0, 1.8, 0.2) * bc * (0.25 + 0.75 * bp);
  if (id == 3) m.emit += vec3(3.0, 0.5, 0.2) * uHeat * smoothstep(0.02, 0.0, abs(p.y - PH - 0.02)) * step(0.1, p.z);
  return dirty(m, p, 0.45);
}
// the laser lattice across the opening (a plane at z = 0): diagonal beams, red heating to white
vec3 lattice(vec3 ro, vec3 rd, float depth) {
  if (abs(rd.z) < 1e-4) return vec3(0);
  float tz = -ro.z / rd.z;
  if (tz < 0.0 || tz > depth) return vec3(0);
  vec3 p = ro + rd * tz;
  if (abs(p.x) > PX - PR || p.y < 0.05 || p.y > PH) return vec3(0);
  vec2 u = vec2(p.x + p.y, p.x - p.y) * 3.2;
  vec2 g = abs(fract(u) - 0.5);
  float l = smoothstep(0.03, 0.0, 0.5 - max(g.x, g.y));
  float flick = 0.85 + 0.15 * sin(uTime * 60.0 + p.y * 9.0);
  return l * flick * mix(vec3(3.0, 0.1, 0.6), vec3(5.0, 3.2, 2.4), uHeat * uHeat);
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  fc = heatWarp(fc, uHeat * 1.2, uRes.y * 0.25, uRes.y * 0.2);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  col += lattice(ro, rd, depth);
  // the floor under the gate glows with heat
  vec3 p = ro + rd * min(depth, 60.0);
  if (depth < 100.0 && p.y < 0.004) {
    float g = exp(-pow(length(vec2(p.x * 0.6, p.z * 1.2)), 2.0) * 1.5);
    float cr = voronoiEdge(p.xz * 3.0).x;
    col += vec3(2.4, 0.5, 0.08) * uHeat * uHeat * g * (0.3 + 1.2 * smoothstep(0.06, 0.0, cr));
  }
  return col * (0.92 + 0.08 * scanlines(fc.y, 1.3));
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('40, 18, 50', 1.2), uCycB: rgb('10, 6, 16', 1.1),
      uFloorCol: rgb('72, 70, 78', 0.85), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [0.2, 1.0, 0.6], uKeyCol: [2.0, 2.1, 2.5], uKeySize: 0.45, uExpo: 1.2,
      uRimA: [2.2, 0.7, 2.6], uRimB: [2.6, 0.9, 0.3],
      uHaze: 0.04, uHazeCol: [0.05, 0.02, 0.04],
      uClimb: 0.4, uHeat: 0.2, uTear: 0, uStrike: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const h = heatAt(t);
      u.uClimb.value = climbAt(t); u.uHeat.value = h; u.uTear.value = tearAt(t);
      u.uStrike.value = spring(t, tF - 0.06, 0.32, 0.12);
      const fl = (0.85 + 0.15 * Math.sin(t * 21.0) * Math.sin(t * 6.1)) * h;
      u.uP1.value = [0, 1.6, -0.9]; u.uP1c.value = [9 * fl, 2.2 * fl, 0.5 * fl];
      u.uP2.value = [0, 2.6, 1.8]; u.uP2c.value = [2.0 + 2 * h, 1.2, 2.4 - h];
      u.uHazeCol.value = [0.05 + 0.08 * h, 0.02 + 0.02 * h, 0.04];
    },
    post(t) { return grade(t, { exposure: 1.0, bloom: 0.09 }); },
  };
};
