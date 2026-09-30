// Shared helpers for s14-scrolls, s15-graves, s17-we-see, s23-reed and s25-stones (v2).
// Picture modules: XF_GLSL after STUDIO_GLSL (and CYBER_GLSL when used).
//   float sdDrone(vec3 q, float spin)          a small quad drone (body, arms, rotor rings), centred at q = 0
//   float sdVisor(vec3 q)                      a wraparound AR visor on a thin post (lens faces +z), post foot at q = 0
//   float visorLens(vec3 q)                    < 0 on the visor's black lens shell (for the material)
//   vec2  crackLight(vec2 f, vec2 hs, float seed, float reach)
//        light breaking out through fractures round a word zone (a box of half size hs at f = 0):
//        x = crack light 0..1 outside the zone, y = 1 inside the zone (keep it dark: the word sits there)
//   float waveTrace(vec2 uv, float t, float fork)   a voice waveform trace (uv 0..1); fork splits it
//        into two forked lie-signals (returns the trace mask; the fork's share is in gFork)
// Lyric modules (JS):
//   fullFrame(cam)                             a text plane that fills the frame
//   onSurface(ctx, cam, o, ax, ay, mpp, fn)    draw fn() in canvas px on a world surface: o the
//        world point of the text origin, ax/ay unit world axes (right, up) along the surface,
//        mpp metres per canvas px. Inside fn, (0, 0) is o, +x is ax, +y is DOWN the surface.
import { project } from '/song/lib/look.js';

export const XF_GLSL = /* glsl */ `
float sdDrone(vec3 q, float spin) {
  float bb = length(q) - 0.26;
  if (bb > 0.05) return bb;
  float d = sdRoundBox(q, vec3(0.075, 0.022, 0.06), 0.018);
  vec3 a = vec3(abs(q.x), q.y, abs(q.z));
  d = min(d, sdCapsule(a, vec3(0.03, 0.01, 0.03), vec3(0.14, 0.02, 0.12), 0.008));
  vec3 r = a - vec3(0.14, 0.03, 0.12);
  d = min(d, sdTorus(r, vec2(0.075, 0.005)));
  d = min(d, sdCyl(r, 0.012, 0.012));
  // a blurred rotor disc (thin, spinning): a faint blade shape
  float bl = abs(sin(atan(r.z, r.x) * 1.0 + spin)) ;
  d = min(d, max(sdCyl(r - vec3(0, 0.012, 0), 0.07, 0.0015), bl - 0.18));
  // the nozzle under the body
  d = min(d, sdCapsule(q, vec3(0.0, -0.02, 0.03), vec3(0.0, -0.05, 0.07), 0.009));
  return d;
}

float visorLens(vec3 q) {
  vec3 c = q - vec3(0.0, 1.45, -0.06);
  float sh = abs(length(c.xz * vec2(0.8, 1.0)) - 0.16) - 0.012;
  sh = max(sh, abs(c.y) - 0.085 + 0.02 * c.x * c.x * 20.0);
  sh = max(sh, -c.z + 0.02);
  return sh;
}
float sdVisor(vec3 q) {
  float bb = length(q - vec3(0.0, 0.8, 0.0)) - 0.95;
  if (bb > 0.05) return bb;
  float post = sdCapsule(q, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.32, -0.06), 0.014);
  float foot = sdCyl(q - vec3(0.0, 0.01, 0.0), 0.12, 0.01) - 0.004;
  vec3 c = q - vec3(0.0, 1.45, -0.06);
  // the head band behind the lens
  float band = abs(length(c.xz * vec2(0.8, 1.0)) - 0.17) - 0.01;
  band = max(band, abs(c.y - 0.01) - 0.018);
  float d = min(min(post, foot), band);
  d = min(d, visorLens(q));
  return d;
}

float sdBox2(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
// branching fracture lines (0..1) with a soft halo: f in metres, density = cells per metre
float fractureLines(vec2 f, float seed, float density) {
  vec2 w = f + 0.12 / density * 6.0 * vec2(fbm(f * density * 0.6 + seed, 3), fbm(f * density * 0.6 + seed + 5.2, 3));
  float e = voronoiEdge(w * density + seed * 5.3).x;
  float gate = smoothstep(0.3, 0.55, vnoise(f * density * 0.45 + seed * 9.1));
  return (smoothstep(0.03, 0.006, e) + 0.22 * exp(-e * 22.0)) * gate;
}
vec2 crackLight(vec2 f, vec2 hs, float seed, float reach) {
  float dz = sdBox2(f, hs) + 0.014 * (fbm(f * 6.0 + seed, 3) - 0.5);
  float e = voronoiEdge((f + 0.05 * vec2(fbm(f * 4.0 + seed, 3), fbm(f * 4.0 + seed + 3.3, 3))) * 6.0 + seed * 5.3).x;
  float gate = vnoise(f * 3.0 + seed * 9.1) + 0.5 * smoothstep(reach, 0.0, dz);
  float crack = (smoothstep(0.035, 0.007, e) + 0.25 * exp(-e * 20.0)) * smoothstep(0.45, 0.6, gate);
  crack *= smoothstep(reach, reach * 0.25, dz) * smoothstep(0.0, 0.03, dz);
  // the scorched seam right round the word glows hottest
  float seam = smoothstep(0.02, 0.0, abs(dz - 0.012)) * (0.5 + 0.5 * vnoise(f * 8.0 + seed));
  return vec2(max(crack, seam * 0.8 * smoothstep(0.0, 0.2, reach)), smoothstep(0.012, -0.012, dz));
}

float gFork = 0.0;
float waveTrace(vec2 uv, float t, float fork) {
  float x = uv.x * 18.0;
  float env = 0.55 + 0.45 * sin(uv.x * 3.1416);
  float y0 = 0.5 + 0.18 * env * (0.6 * sin(x * 2.3 + t * 7.0) + 0.4 * sin(x * 5.1 - t * 11.0)) * (0.6 + 0.4 * vnoise(vec2(x * 2.0, t * 3.0)));
  float w = 0.012;
  float m = smoothstep(w, w * 0.3, abs(uv.y - y0));
  gFork = 0.0;
  if (fork > 0.0) {
    // two jagged branches peel away from the true line, growing from the left
    float grow = smoothstep(uv.x - 0.08, uv.x, fork * 1.1);
    float jag = 0.06 * (fract(x * 1.7) - 0.5) + 0.03 * sin(x * 9.0 + t * 20.0);
    float sep = 0.16 * grow * (0.4 + 0.6 * uv.x);
    float b1 = smoothstep(w, w * 0.3, abs(uv.y - (y0 + sep + jag)));
    float b2 = smoothstep(w, w * 0.3, abs(uv.y - (y0 - sep - jag)));
    gFork = max(b1, b2) * grow;
    m = max(m * (1.0 - 0.7 * grow), gFork);
  }
  return m;
}
`;

// ---------- JS (lyric side) ----------
export const fullFrame = (cam) => {
  const sub = (a, b) => a.map((v, i) => v - b[i]), nrm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const ww = nrm(sub(cam.target, cam.pos)), r = cam.roll ?? 0;
  const uu = nrm(cross(ww, [Math.sin(r), Math.cos(r), 0])), vv = cross(uu, ww);
  const hh = Math.tan((cam.fov * Math.PI) / 360), hw = hh * 16 / 9;
  return { c: cam.pos.map((v, i) => v + ww[i]), ax: uu, ay: vv, hs: [hw, hh] };
};

// Map canvas drawing onto a world surface with the affine that matches the camera's projection at o.
export function onSurface(ctx, cam, o, ax, ay, mpp, fn) {
  const K = 1000 * mpp;
  const p0 = project(cam, o);
  if (p0.z <= 0.05) return false;
  const px = project(cam, o.map((v, i) => v + ax[i] * K));
  const py = project(cam, o.map((v, i) => v + ay[i] * K));
  ctx.save();
  ctx.transform((px.x - p0.x) / 1000, (px.y - p0.y) / 1000, -(py.x - p0.x) / 1000, -(py.y - p0.y) / 1000, p0.x, p0.y);
  fn();
  ctx.restore();
  return true;
}
