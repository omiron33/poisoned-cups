// The film's shared look: palette, the grade, timing helpers and the flame's journey.
// Scene (picture) modules import this; anything here is part of every picture.
import { keys, ease, wordState, smartQuotes, clamp01 } from '/engine.js';
import lyrics from '/timing.js';

// sRGB 0..255 strings for Canvas, and linear triples for shaders
export const BONE = '246, 240, 230';
export const INK = '20, 16, 15';
export const GOLD = '242, 196, 104';
export const FLAME = '255, 122, 56';        // the signal: the only colour that glows
export const OXBLOOD = '140, 18, 30';

const lin = (c) => Math.pow(c / 255, 2.2);
export const rgb = (s, k = 1) => s.split(',').map((v) => lin(+v) * k);

// The grade. `w` is how far the film has moved from the flame's heat toward the white of the end.
export function grade(t, extra = {}) {
  return {
    saturation: 1.02, contrast: 1.06,
    lift: [0.012, 0.009, 0.008], gain: [1.02, 0.99, 0.96],
    grain: 0.035, vignette: 0.42, ca: 0.28,
    bloom: 0.07, threshold: 1.25,
    ...extra,
  };
}

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const mix = (a, b, k) => (Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * k) : a + (b - a) * k);

// An underdamped spring from 0 to 1 over `dur` seconds after t0 (a hit that settles, no dead stop).
export function spring(t, t0, dur = 0.5, bounce = 0.35) {
  const x = (t - t0) / dur;
  if (x <= 0) return 0;
  if (x >= 3) return 1;
  const w = 9.0, z = 1 - bounce;
  return 1 - Math.exp(-z * w * x * 0.9) * Math.cos(w * x * (1 - z * 0.3));
}

export function linesFrom(...prefixes) {
  const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
  let from = 0;
  return prefixes.map((p) => {
    const l = lyrics.lines.find((l) => l.start >= from && norm(l.text).startsWith(norm(p)));
    if (!l) throw Error('no line: ' + p);
    from = l.start + 0.01;
    return { ...l, words: lyrics.words.filter((w) => w.start >= l.start - 0.05 && w.end <= l.end + 0.05) };
  });
}

// Measured beats (seconds) near t, for cameras that ease into downbeats.
export const beats = (lyrics.beats ?? []);
export function nextBeat(t) { return beats.find((b) => b >= t) ?? t; }

export const clean = (s) => smartQuotes(s).replace(/[“”"]/g, '');

export { keys, ease, clamp01, wordState, smartQuotes, lyrics };

// Project a world point through a camera to text-canvas pixels (canvas W×H spanning the frame).
export function project(cam, p, W = 3840, H = 2160) {
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const ww = norm(sub(cam.target, cam.pos));
  const roll = cam.roll ?? 0;
  const uu = norm(cross(ww, [Math.sin(roll), Math.cos(roll), 0])), vv = cross(uu, ww);
  const d = sub(p, cam.pos);
  const z = dot(d, ww);
  const f = 1 / Math.tan(((cam.fov ?? 40) * Math.PI) / 360);
  const x = (dot(d, uu) / z) * f, y = (dot(d, vv) / z) * f;
  return { x: W / 2 + x * (H / 2), y: H / 2 - y * (H / 2), z };
}

// A camera that orbits a target: yaw/pitch in radians, distance, with an optional handheld drift
// that is a pure function of t.
export function orbit(t, { target = [0, 0.5, 0], yaw = 0, pitch = 0.2, dist = 4, fov = 35, roll = 0, drift = 0.01 }) {
  const d = drift * (Math.sin(t * 0.7) + 0.5 * Math.sin(t * 1.9 + 1.3));
  const y = yaw + d, p = pitch + d * 0.5;
  return {
    pos: [target[0] + dist * Math.sin(y) * Math.cos(p), target[1] + dist * Math.sin(p), target[2] + dist * Math.cos(y) * Math.cos(p)],
    target, fov, roll: roll + d * 0.2,
  };
}

// Lines (by their opening words, in order) at or after song time `after`. Use this for repeated
// lines such as the second chorus: linesAt(P.from - 1.5, 'Promiscuous girlies', ...).
export function linesAt(after, ...prefixes) {
  const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
  let from = after;
  return prefixes.map((p) => {
    const l = lyrics.lines.find((l) => l.start >= from && norm(l.text).startsWith(norm(p)));
    if (!l) throw Error('no line after ' + after + ': ' + p);
    from = l.start + 0.01;
    return { ...l, words: lyrics.words.filter((w) => w.start >= l.start - 0.05 && w.end <= l.end + 0.05) };
  });
}
