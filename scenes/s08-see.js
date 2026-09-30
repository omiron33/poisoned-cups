// 08 · "Brood of vipers / Do you think I can't see still?"  (v2, hook rung 2: the surveillance cobras)
// Cable-vipers stand upright out of two lit network trenches in a purple data hall, every head a
// camera lens, and above the rack line a city-scale sensor eye (a lidar iris with a sweeping scan
// line) watches everything. Digital noise crawls over the frame. On "I" a warm light falls from
// above (no lamp, no housing: plain light) and the noise dies inside it; it moves once and on
// "see" it stops on one viper, and every hidden cable path under the floor lights up from its
// base. At the end the light withdraws and the camera plunges overhead onto the exposed paths,
// which go cold and square into a grid (s09 opens on a filter mesh).
import { ease, grade, rgb, orbit, linesAt, clamp01, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { VIPER_GLSL } from '/song/lib/x-viper.js';
import { XB_GLSL } from '/song/lib/x-b.js';

// the viper the light finds: base, heading, length, rise (kept in step with the GLSL below)
const V0 = { b: [0.3, 0.08, 0.3], yaw: -2.2, L: 1.3, lift: 0.7 };
const HEAD0 = [V0.b[0] + Math.cos(V0.yaw) * V0.L, V0.lift + 0.1, V0.b[2] + Math.sin(V0.yaw) * V0.L];

export default (P) => {
  const t0 = P.from;
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');
  const tB = L1.words[0].start, tV = L1.words[2].start;
  const tI = L2.words.find((w) => /^i$/i.test(w.w)).start;
  const tSee = L2.words.find((w) => /^see/i.test(w.w)).start;
  const tOut = P.to - 1.25;          // the light withdraws
  const camera = (t) => {
    const u = t - t0;
    const a = spring(t, tI - 0.05, 0.45, 0.2), b = spring(t, tSee - 0.04, 0.5, 0.2);
    const target = mix(mix([0, 0.7, -0.4], [-0.1, 0.7, -0.5], a), [HEAD0[0], HEAD0[1] - 0.15, HEAD0[2]], b);
    // exit: an overhead plunge onto the exposed cable paths round the found viper's base
    const c = ease.inOut3((t - (tOut + 0.2)) / 0.95);
    const base = [V0.b[0] + 0.1, 0.0, V0.b[2] - 0.2];
    const o = orbit(t, { target: mix(target, base, c), yaw: 0.25 - 0.03 * u - 0.12 * a + 0.1 * b - 0.3 * c, pitch: mix(0.14 + 0.05 * a + 0.06 * b, 1.35, c), dist: mix(4.8 - 0.9 * a - 1.2 * b, 1.9, c), fov: 38, drift: 0.01 });
    return o;
  };
  const beamAt = (t) => {
    const on = ease.out5((t - tI + 0.02) / 0.1) * (1 - ease.inOut3((t - tOut) / 0.5));
    const k = ease.inOut3((t - tI) / Math.max(0.2, tSee - tI));
    const x = mix(HEAD0[0] + 1.3, HEAD0[0], k), z = mix(HEAD0[2] + 0.5, HEAD0[2], k);
    const r = 0.42 + 0.12 * spring(t, tSee, 0.4, 0.3);
    return { on, x, z, r };
  };
  const tearAt = (t) => [tB, tV].reduce((a, h) => Math.max(a, t >= h && t < h + 0.1 ? 1 - (t - h) / 0.1 : 0), 0);
  return {
    name: 's08-see', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + VIPER_GLSL + XB_GLSL + /* glsl */ `
uniform vec4 uBeam;   // x, z, radius, on
uniform float uReveal, uCold, uNoise, uTear;
const vec2 VB = vec2(${V0.b[0].toFixed(3)}, ${V0.b[2].toFixed(3)});
float trench(vec3 p, float z) { return sdBox(p - vec3(0.0, 0.0, z), vec3(4.0, 0.012, 0.11)); }
float mapObj(vec3 p, out int id) {
  id = 2;
  float d = sdRacks(p, -3.2, 0.64, 2.3, 0.04, 8.0);
  float v = min(trench(p, 0.3), trench(p, -0.95)); if (v < d) { d = v; id = 3; }
  float b = length(p - vec3(0, 0.6, -0.3)) - 2.4;
  if (b > d) return d;
  if (b > 0.25) return min(d, b);
  float T = uTime;
  gVipLens = 1.0;
  v = viperAt(p, vec3(${V0.b.join(', ')}), ${V0.yaw.toFixed(3)}, ${V0.L.toFixed(3)}, 0.075, 0.1, 5.0, T * 0.9, ${V0.lift.toFixed(3)}, 3.0);  if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(-1.2, 0.07, 0.3), 2.6, 1.2, 0.07, 0.12, 5.5, T * 1.1 + 1.0, 0.75, 3.0);   if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(1.1, 0.07, 0.3), -0.6, 1.3, 0.07, 0.1, 5.0, T * 0.8 + 2.0, 1.05, 3.0);  if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(1.3, 0.07, -0.95), 0.4, 1.1, 0.065, 0.12, 6.0, T * 1.2 + 3.0, 0.8, 3.0);   if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(-0.5, 0.07, -0.95), -1.9, 1.2, 0.07, 0.1, 5.0, T * 1.0 + 4.0, 1.15, 3.0); if (v < d) { d = v; id = 1; keepViper(); }
  v = viperAt(p, vec3(-1.7, 0.07, -0.95), 3.6, 1.1, 0.065, 0.1, 5.5, T * 0.9 + 5.0, 0.95, 3.0);  if (v < d) { d = v; id = 1; keepViper(); }
  gVipLens = 0.0;
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 1) {
    Mat m = viperMat(0.0);
    // the lens glass glows a faint surveillance red-magenta while the eye watches
    if (gV.w > 1.5 && gV.w < 2.5) m.emit = vec3(1.4, 0.05, 0.6) * (1.0 - uReveal) * 0.8;
    return m;
  }
  if (id == 3) {
    // a network trench: a steel grating over an acid-green lit channel
    Mat m = M(vec3(0.18, 0.19, 0.2), 0.45, 1.0);
    float g = smoothstep(0.35, 0.2, abs(fract(p.x * 22.0) - 0.5));
    m.emit = vec3(0.2, 1.6, 0.35) * g * (0.6 + 0.4 * sin(p.x * 3.0 - uTime * 4.0)) * (1.0 - 0.8 * uCold);
    return m;
  }
  Mat m = rackMat(p, n, -3.2, uTime);
  m.emit = vec3(m.emit.g * 0.2, m.emit.g, m.emit.g * 0.3) + vec3(m.emit.r - m.emit.g, 0.0, m.emit.r - m.emit.g);
  m.alb = mix(m.alb, vec3(0.3, 0.31, 0.33) * 0.72, smoothstep(2.0, 3.5, length(p - uCamPos)));
  return dirty(m, p, 0.8);
}
// the sensor eye in the sky over the racks: an iris of blades, a dark pupil, a sweeping scan line
vec3 sensorEye(vec3 rd) {
  vec3 E = normalize(vec3(0.25, 0.36, -1.0));
  vec3 eu = normalize(cross(E, vec3(0, 1, 0))), ev = cross(eu, E);
  float kd = dot(rd, E);
  if (kd < 0.9) return vec3(0);
  vec2 q = vec2(dot(rd, eu), dot(rd, ev)) / kd / 0.2;
  float r = length(q), a = atan(q.y, q.x);
  vec3 c = vec3(0);
  float ring = smoothstep(0.012, 0.0, abs(r - 1.0)) + 0.6 * smoothstep(0.008, 0.0, abs(r - 0.93));
  float ticks = step(0.9, fract(a * 60.0 / 6.2831853)) * step(0.93, r) * step(r, 1.0);
  float blades = smoothstep(0.465, 0.49, abs(fract((a + r * 1.3) * 9.0 / 6.2831853) - 0.5)) * step(0.3, r) * step(r, 0.92);
  float pupil = smoothstep(0.31, 0.29, r);
  float sweep = pow(sat(1.0 - abs(mod(a - uTime * 2.2, 6.2831853) - 0.2) / 0.5), 4.0) * step(r, 0.92) * step(0.3, r);
  c += vec3(0.8, 0.75, 1.0) * (ring + ticks) * 0.9;
  c += vec3(0.6, 0.3, 1.1) * blades * 0.7;
  c += vec3(0.25, 1.4, 0.4) * sweep * 0.8;
  c *= 1.0 - pupil;
  c += vec3(1.3, 0.1, 0.55) * smoothstep(0.08, 0.0, abs(r - 0.3)) * 0.8;
  return c * (1.0 - 0.7 * uCold);
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  if (depth > 100.0) col += sensorEye(rd);
  vec3 p = ro + rd * min(depth, 60.0);
  float inBeam = 0.0;
  if (uBeam.w > 0.001) {
    float r = uBeam.z;
    float m = smoothstep(r, r * 0.55, length(p.xz - uBeam.xy)) * step(depth, 100.0) * step(p.y, 5.0);
    inBeam = m * uBeam.w;
    col *= 1.0 + uBeam.w * m * vec3(8.0, 7.0, 5.4);
    col += uBeam.w * m * vec3(0.05, 0.04, 0.025);
    // the shaft itself in the haze
    vec2 o = ro.xz - uBeam.xy, dv = rd.xz;
    float A = dot(dv, dv), B = dot(o, dv), C = dot(o, o) - r * r;
    float disc = B * B - A * C;
    if (disc > 0.0 && A > 1e-6) {
      float sq = sqrt(disc);
      float ta = max((-B - sq) / A, 0.0), tb = min((-B + sq) / A, min(depth, 40.0));
      float tc = -B / A;
      float dmin = length(o + dv * tc);
      float len = max(tb - ta, 0.0) * (1.0 - dmin * dmin / (r * r));
      col += uBeam.w * vec3(1.0, 0.86, 0.62) * len * 0.14;
      inBeam = max(inBeam, uBeam.w * sat(len * 2.0));
    }
  }
  // the hidden cable paths under the floor, lit from the found viper's base
  if (depth < 100.0 && p.y < 0.004 && uReveal > 0.001) {
    float tr = cableTraces(p.xz, VB, uReveal * 4.5, 0.4);
    vec2 g = abs(fract(p.xz * 9.0) - 0.5);
    float grid = smoothstep(0.035, 0.015, 0.5 - max(g.x, g.y)) * smoothstep(4.5, 1.0, length(p.xz - VB)) * 0.7;
    float m = mix(tr, max(tr * 0.5, grid), uCold);
    col += m * mix(vec3(2.2, 1.6, 0.8), vec3(0.8, 0.9, 1.0), uCold);
  }
  // digital noise over the watched hall; the light is clean
  float nz = hash12(floor(fc / 3.0) + floor(uTime * 30.0) * 17.0);
  col = mix(col, col * 0.6 + vec3(0.06, 0.05, 0.08) * nz, uNoise * 0.35 * (1.0 - inBeam));
  col *= mix(1.0, scanlines(fc.y, 1.2), 0.15 * (1.0 - inBeam));
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('44, 26, 64', 1.3), uCycB: rgb('10, 8, 20', 1.2),
      uFloorCol: rgb('78, 78, 88', 0.85), uFloorRough: 0.12, uGrime: 0.9,
      uKeyDir: [-0.3, 1.0, 0.45], uKeyCol: [2.4, 2.5, 3.1], uKeySize: 0.5, uExpo: 1.35,
      uRimA: [1.8, 0.8, 2.8], uRimB: [0.5, 2.6, 0.8],
      uHaze: 0.03, uHazeCol: [0.03, 0.025, 0.045],
      uBeam: [0, 0, 0.4, 0], uReveal: 0, uCold: 0, uNoise: 1, uTear: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      const b = beamAt(t);
      u.uBeam.value = [b.x, b.z, b.r, b.on];
      u.uReveal.value = ease.out3((t - tSee) / 1.4);
      u.uCold.value = ease.inOut3((t - tOut) / 0.8);
      u.uNoise.value = 1 - 0.8 * ease.out3((t - tI) / 0.2);
      u.uTear.value = tearAt(t);
      u.uP2.value = [-1.0, 1.8, 1.6]; u.uP2c.value = [3.0, 2.6, 4.2];
      u.uP1.value = [b.x, 3.2, b.z]; u.uP1c.value = [6 * b.on, 5.0 * b.on, 3.6 * b.on];
    },
    post(t) { return grade(t, { exposure: 1.0 }); },
  };
};
