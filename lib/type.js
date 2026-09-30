// The words' voices and the lyric idioms (v2: system-generated type). Only lyric modules import
// this, so typography changes never re-render pictures. Every word is set by what it means:
//   divine     God, I, My: gold-white Garamond capitals, luminous and never glitched
//   violent    vipers, fire, kill, blood, liar: heavy Anton in hot magenta
//   toxic      poison, twist, sell, silver, heavy loads: Anton in acid green
//   claim      the polished surface and their slogans: light Inter Tight capitals, tracked
//   mercy      hearts, turn, reed, bruised, the poor: Garamond italic, pale lavender
//   cite       machine labels and dossiers: JetBrains Mono
//   plain      everything else: Anton capitals in cold white
import { keys, ease, wordState, smartQuotes, clamp01, clean, spring, INK, BONE, lyrics } from '/song/lib/look.js';
export * from '/song/lib/look.js';

// ---------- fonts (the song's own; the engine supplies EB Garamond and Inter Tight) ----------
const FONTS = [
  ['Anton', 'Anton-Regular.ttf', {}],
  ['JetBrains Mono', 'JetBrainsMono-Medium.ttf', { weight: '500' }],
  ['JetBrains Mono', 'JetBrainsMono-ExtraBold.ttf', { weight: '800' }],
];
await Promise.all(FONTS.map(async ([fam, file, d]) => {
  const buf = await fetch('/song/fonts/' + file).then((r) => { if (!r.ok) throw Error('font ' + file); return r.arrayBuffer(); });
  const f = new FontFace(fam, buf, d);
  await f.load();
  document.fonts.add(f);
}));

// ---------- the voices (v2) ----------
// colour pairs: [on a dark picture, on a light picture]; both hold 4.5:1 against their ground.
// `stable` voices are never glitched, sliced or shaken by the weapon idioms.
const CLASSES = {
  // the speaker: God, I, My. Restrained, luminous gold-white Garamond capitals; never corrupted.
  divine: {
    words: ['god', 'i', 'my'],
    color: ['255, 236, 196', '92, 60, 12'], font: (px) => `600 ${px}px "EB Garamond"`, track: 0.08, scale: 1.15, caps: true, stable: true, glow: '255, 214, 150',
  },
  // violent accusation: heavy Anton in hot magenta
  violent: {
    words: ['vipers', 'brood', 'fire', 'fire?', 'kill', 'blood', 'crush', 'liar', 'darkness', 'rotting', 'bones', 'sharpened', 'cut', 'guard'],
    color: ['255, 92, 170', '150, 0, 80'], font: (px) => `400 ${px}px "Anton"`, track: 0.02, scale: 1.14, caps: true,
  },
  // poison: acid green
  toxic: {
    words: ['poison', 'twist', 'sell', 'pays', 'silver', 'heavy', 'loads', 'blind', 'proud', 'thin', 'strain', 'tongues', 'camel', 'gnat'],
    color: ['150, 255, 110', '20, 96, 30'], font: (px) => `400 ${px}px "Anton"`, track: 0.02, scale: 1.1, caps: true,
  },
  // the polished claim: ad copy, PR slogans. Light Inter Tight capitals, widely tracked, cold silver.
  claim: {
    words: ['polish', 'cups', 'white', 'stone', 'walls', 'prayers', 'soft-spoke', 'honor', 'scrolls', 'kiss', 'paint', 'incense', 'skill', 'gate', 'empire', 'fringes', 'smile', 'clean', 'palms', 'we', 'we’re', 'dreams'],
    color: ['226, 232, 244', '30, 34, 44'], font: (px) => `300 ${px}px "Inter Tight"`, track: 0.16, scale: 0.95, caps: true,
  },
  // mercy: calm Garamond italic, pale lavender
  mercy: {
    words: ['hearts', 'turn', 'reed', 'bruised', 'cracked', 'widow', 'poor', 'truth', 'prophets', 'bend', 'stones', 'speak', 'will', 'see', 'never'],
    color: ['232, 224, 255', '40, 24, 96'], font: (px) => `italic 500 ${px}px "EB Garamond"`, track: 0.0, scale: 1.25, caps: false,
  },
  // machine voice: labels, dossiers, system captions
  cite: { words: [], color: ['196, 214, 206', '40, 52, 48'], font: (px) => `800 ${Math.round(px * 0.72)}px "JetBrains Mono"`, track: 0.06, scale: 1.0, caps: true },
};
export const VOICES = CLASSES;
const LEX = {};
for (const [k, c] of Object.entries(CLASSES)) for (const w of c.words) LEX[w] = k;
// plain words: condensed Anton capitals in cold white
const PLAIN = { color: ['238, 242, 250', '16, 16, 22'], font: (px) => `400 ${px}px "Anton"`, track: 0.02, scale: 1, caps: true };

export const keyOf = (word) => clean(word).toLowerCase().replace(/[“”"(),.;:!?]/g, '').replace(/'/g, '’');
export function voiceOf(word) { return CLASSES[LEX[keyOf(word)]] ?? PLAIN; }
export const isStable = (word, o = {}) => !!((o.voice ?? voiceOf(word)).stable);
export function classOf(word) { return LEX[keyOf(word)] ?? 'plain'; }
// the word as it is shown: typographic quotes, no trailing comma or full stop
export function shown(word, keepPunct = false) {
  let s = clean(word).replace(/^[“"]/, '').replace(/[”"]$/, '');
  if (!keepPunct) s = s.replace(/[,;:.]+$/, '');
  return s;
}

// Set one word in its voice at baseline (x, y). px is the line's size; `ground` 'dark' or 'light'
// picks the ink; alpha 0..1; ink overrides the colour. Returns the advance to the next word.
export function paint(ctx, word, x, y, px, { alpha = 1, ground = 'dark', ink, voice, keepPunct = false } = {}) {
  const v = voice ?? voiceOf(word);
  let s = shown(word, keepPunct);
  if (v.caps) s = s.toUpperCase();
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size);
  ctx.letterSpacing = `${(v.track ?? 0) * size}px`;
  const w = ctx.measureText(s).width;
  if (alpha > 0.002) {
    if (v.glow && ground !== 'light' && !ink) { ctx.shadowColor = `rgba(${v.glow}, ${(0.55 * Math.min(1, alpha)).toFixed(3)})`; ctx.shadowBlur = size * 0.35; }
    ctx.fillStyle = `rgba(${ink ?? v.color[ground === 'light' ? 1 : 0]}, ${Math.min(1, alpha).toFixed(3)})`;
    ctx.fillText(s, x, y);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  }
  ctx.letterSpacing = '0px';
  ctx.font = PLAIN.font(px);
  return w + px * 0.26;   // a generous word space: nothing runs together
}
export function measure(ctx, word, px, opts = {}) { return paint(ctx, word, 0, 0, px, { ...opts, alpha: 0 }); }
export function lineWidth(ctx, words, px, opts = {}) {
  let w = 0;
  for (const x of words) w += measure(ctx, x.w ?? x, px, opts);
  return w - px * 0.26;
}

// ---------- word timing ----------
// arrival k (0..1, fast out) and a settling spring s (overshoots a little) for a word at time t
export function arrive(w, t, dur = 0.16) {
  // fully shown within 0.08 s of the onset whatever the word's length (the readability gate)
  const a = ease.out3((t - w.start) / 0.08);
  return { a, k: ease.out3((t - w.start) / Math.min(dur, 0.1)), s: spring(t, w.start, 0.45, 0.3), on: t >= w.start };
}
// fade a block out over [t0, t1]
export const outFade = (t, t0, t1) => 1 - ease.inOut3((t - t0) / Math.max(1e-3, t1 - t0));

// ---------- idioms ----------
// Each idiom draws one or more lyric lines in its own choreography. Canvas coordinates are the
// text canvas (3840×2160 for a full-frame camera plane). `ground` says whether the words sit on a
// dark or light part of the picture.

// 1 · FLOW: a line set word by word on a baseline; each word rises a little and settles.
// Wraps to a second row when it would pass maxW. Returns the rows' bounding box.
export function flow(ctx, line, t, { x = 240, y = 1500, px = 170, maxW = 3300, lead = 1.12, ground = 'dark', align = 'left', rise = 0.18, alpha = 1, fade } = {}) {
  const words = line.words ?? line;
  const rows = [[]]; let rw = 0;
  for (const w of words) {
    const adv = measure(ctx, w.w, px, { ground });
    if (rw + adv - px * 0.26 > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push({ w, adv }); rw += adv;
  }
  const out = fade ? outFade(t, fade[0], fade[1]) : 1;
  rows.forEach((row, r) => {
    const total = row.reduce((a, b) => a + b.adv, 0) - px * 0.26;
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const cy = y + r * px * lead;
    for (const { w, adv } of row) {
      const s = arrive(w, t);
      if (s.a > 0.002) paint(ctx, w.w, cx, cy + (1 - s.k) * px * rise, px, { alpha: s.a * out * alpha, ground });
      cx += adv;
    }
  });
  return { rows: rows.length, height: rows.length * px * lead };
}

// 2 · SLAM: every word gets its own row, big, and lands on its onset with a spring from larger.
// The stack scrolls up so the newest word sits at `y`; older rows shrink back and dim.
export function slam(ctx, line, t, { x = 260, y = 1250, px = 330, ground = 'dark', keep = 3, align = 'left', gap = 0.98, alpha = 1, fade } = {}) {
  const words = (line.words ?? line);
  const sung = words.filter((w) => t >= w.start);
  const out = fade ? outFade(t, fade[0], fade[1]) : 1;
  const n = sung.length;
  if (!n) return;
  // the scroll: the stack moves up one row each time a word lands, with a spring
  let scroll = 0;
  for (let i = 1; i < n; i++) scroll += spring(t, words[i].start, 0.32, 0.2);
  for (let i = Math.max(0, n - keep - 1); i < n; i++) {
    const w = words[i];
    const age = n - 1 - i - (scroll - (n - 1));
    const s = arrive(w, t);
    const sc = 1 + (1 - s.s) * 0.35;
    const dim = i === n - 1 ? 1 : 0.55;
    const size = px * (i === n - 1 ? 1 : 0.62);
    const yy = y - (n - 1 - i) * px * gap * 0.72 - (scroll - Math.floor(scroll)) * 0;
    const a = s.a * out * alpha * clamp01(1 - (n - 1 - i - keep + 1) * 0.9);
    if (a < 0.003) continue;
    ctx.save();
    const wd = measure(ctx, w.w, size, { ground });
    const ax = align === 'center' ? x : align === 'right' ? x - wd / 2 : x + wd / 2;
    ctx.translate(ax, yy); ctx.scale(sc, sc);
    paint(ctx, w.w, -wd / 2, 0, size, { alpha: a * dim, ground });
    ctx.restore();
    void age;
  }
}

// 3 · ORBIT: words ride a circle (a record, an iris, a ring), each laid down at its onset, the
// whole ring turning. cx, cy centre; r radius; a0 start angle; turn radians per second.
export function ringText(ctx, line, t, { cx = 1920, cy = 1080, r = 800, a0 = -Math.PI * 0.9, turn = 0.25, px = 120, ground = 'dark', t0 = 0, alpha = 1, fade, inside = false } = {}) {
  const words = line.words ?? line;
  const out = fade ? outFade(t, fade[0], fade[1]) : 1;
  let ang = a0 + (t - t0) * turn;
  for (const w of words) {
    const v = voiceOf(w.w);
    let s = shown(w.w); if (v.caps) s = s.toUpperCase();
    const size = Math.round(px * v.scale);
    ctx.font = v.font(size); ctx.letterSpacing = `${(v.track ?? 0) * size}px`;
    const st = arrive(w, t);
    for (const ch of s) {
      const cw = ctx.measureText(ch).width;
      const da = (cw / 2) / r;
      ang += da;
      if (st.a > 0.002) {
        ctx.save();
        ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.rotate(ang + (inside ? -Math.PI / 2 : Math.PI / 2));
        ctx.fillStyle = `rgba(${v.color[ground === 'light' ? 1 : 0]}, ${(st.a * out * alpha).toFixed(3)})`;
        ctx.fillText(ch, -cw / 2, (1 - st.k) * -size * 0.3);
        ctx.restore();
      }
      ang += da;
    }
    ang += (px * 0.34) / r;
    ctx.letterSpacing = '0px';
  }
}

// 4 · STAMP: a boxed citation that thumps down (scale from 1.6, slight rotation) at time t0.
export function stamp(ctx, text, t, t0, { x = 3000, y = 400, px = 90, rot = -0.06, ground = 'dark', color, alpha = 1, fade } = {}) {
  const s = spring(t, t0, 0.35, 0.25);
  if (t < t0) return;
  const out = fade ? outFade(t, fade[0], fade[1]) : 1;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot * s); ctx.scale(1 + (1 - s) * 0.6, 1 + (1 - s) * 0.6);
  ctx.font = `800 ${px}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.12}px`;
  const w = ctx.measureText(text).width;
  const c = color ?? (ground === 'light' ? '138, 16, 28' : '255, 128, 64');
  const a = clamp01(s * 1.5) * out * alpha;
  ctx.strokeStyle = `rgba(${c}, ${a.toFixed(3)})`; ctx.lineWidth = px * 0.09;
  ctx.strokeRect(-w / 2 - px * 0.45, -px * 1.05, w + px * 0.9, px * 1.45);
  ctx.fillStyle = `rgba(${c}, ${a.toFixed(3)})`;
  ctx.fillText(text, -w / 2, 0);
  ctx.restore(); ctx.letterSpacing = '0px';
}

// 5 · NOTE: small tracked capitals (an annotation beside the big type), with a hairline rule.
export function note(ctx, text, x, y, { px = 44, alpha = 0.85, ground = 'dark', rule = 0, align = 'left', color } = {}) {
  ctx.font = `500 ${px}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.22}px`;
  const c = color ?? (ground === 'light' ? INK : BONE);
  ctx.fillStyle = `rgba(${c}, ${alpha})`;
  const w = ctx.measureText(text).width;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.fillText(text, x0, y);
  if (rule) { ctx.fillRect(x0, y + px * 0.55, rule, Math.max(2, px * 0.05)); }
  ctx.letterSpacing = '0px';
  return w;
}

// 6 · FEED: lines arrive as cards in a phone feed that scrolls up (for the scrolling verse).
// Each card is a rounded panel holding the words; the newest card slides in at the bottom.
export function feed(ctx, lines, t, { x = 1320, y = 1850, w = 1200, px = 92, gap = 40, ground = 'dark', alpha = 1 } = {}) {
  const shownLines = lines.filter((l) => t >= l.words[0].start - 0.05);
  let yy = y;
  for (let i = shownLines.length - 1; i >= 0; i--) {
    const l = shownLines[i];
    const k = spring(t, l.words[0].start - 0.05, 0.4, 0.15);
    // wrap the words into the card
    const rows = [[]]; let rw = 0;
    for (const wd of l.words) { const adv = measure(ctx, wd.w, px); if (rw + adv > w - px && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push({ wd, adv }); rw += adv; }
    const h = rows.length * px * 1.2 + px * 0.9;
    yy -= h * k;
    const a = alpha * clamp01(k * 2) * clamp01(1 - (y - yy - 1500) / 300);
    ctx.fillStyle = `rgba(${ground === 'light' ? '255, 255, 255' : '14, 12, 18'}, ${(0.82 * a).toFixed(3)})`;
    ctx.beginPath(); ctx.roundRect(x, yy, w, h, px * 0.4); ctx.fill();
    ctx.strokeStyle = `rgba(${ground === 'light' ? INK : BONE}, ${(0.25 * a).toFixed(3)})`; ctx.lineWidth = 3; ctx.stroke();
    rows.forEach((row, r) => {
      let cx = x + px * 0.5;
      for (const { wd, adv } of row) {
        const s = arrive(wd, t);
        if (s.a > 0.002) paint(ctx, wd.w, cx, yy + px * 1.2 * (r + 1) + px * 0.05, px, { alpha: s.a * a, ground: ground === 'light' ? 'light' : 'dark' });
        cx += adv;
      }
    });
    yy -= gap;
  }
}

// 7 · RECEIPT: mono lines printed one character at a time as each word is sung (a till roll).
export function receipt(ctx, line, t, { x = 2500, y = 600, px = 70, ground = 'light', alpha = 1 } = {}) {
  ctx.font = `500 ${px}px "JetBrains Mono"`; ctx.letterSpacing = '0px';
  const c = ground === 'light' ? INK : BONE;
  let cx = x;
  for (const w of line.words ?? line) {
    const s = shown(w.w).toUpperCase();
    const n = Math.floor(clamp01((t - w.start) / Math.max(0.06, Math.min(0.25, w.end - w.start))) * s.length + (t >= w.start ? 1 : 0));
    ctx.fillStyle = `rgba(${c}, ${alpha})`;
    ctx.fillText(s.slice(0, Math.min(n, s.length)), cx, y);
    cx += ctx.measureText(s + ' ').width;
  }
}

// 8 · SPLIT: the first half of a line pinned left, the rest pinned right, meeting in the middle.
export function split(ctx, line, t, { y = 1080, px = 200, margin = 240, W = 3840, ground = 'dark', at, alpha = 1, fade } = {}) {
  const words = line.words ?? line;
  const cut = at ?? Math.ceil(words.length / 2);
  flow(ctx, words.slice(0, cut), t, { x: margin, y, px, ground, alpha, fade, maxW: W / 2 - margin });
  flow(ctx, words.slice(cut), t, { x: W - margin, y: y + px * 1.1, px, ground, align: 'right', alpha, fade, maxW: W / 2 - margin });
}

// 9 · HERO: the line set small, with one chosen word (or the loudest class word) blown up huge
// behind or beside it when it is sung.
export function hero(ctx, line, t, word, { x = 240, y = 1880, px = 120, hx = 1920, hy = 1250, hpx = 620, ground = 'dark', hground, alpha = 1, fade } = {}) {
  const words = line.words ?? line;
  const w = words.find((x) => keyOf(x.w).startsWith(word.toLowerCase()));
  const out = fade ? outFade(t, fade[0], fade[1]) : 1;
  if (w && t >= w.start) {
    const s = spring(t, w.start, 0.5, 0.3);
    const wd = measure(ctx, w.w, hpx);
    ctx.save(); ctx.translate(hx, hy); const sc = 0.8 + 0.2 * s; ctx.scale(sc, sc);
    paint(ctx, w.w, -wd / 2, 0, hpx, { alpha: clamp01(s * 1.4) * out * alpha, ground: hground ?? ground });
    ctx.restore();
  }
  flow(ctx, words, t, { x, y, px, ground, alpha, fade });
}

// ---------- weapons: words that hit ----------
// Stable voices (the divine words) are never distorted: they fade up in 0.1 s and hold, luminous.
function steady(w, t, x, y, px, o, ctx) {
  if (!isStable(w.w, o)) return false;
  if (t >= w.start - 0.02) paint(ctx, w.w, x, y, px, { ...o, alpha: (o.alpha ?? 1) * clamp01((t - w.start + 0.02) / 0.1) });
  return true;
}
// All deterministic in t. Each takes a word object { w, start, end } and draws it at (x, y) baseline,
// px size, in its voice (or opts.voice / opts.ink). `ground` as elsewhere. Returns the advance.
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// STRIKE: the word drives in from larger and slightly rotated, lands on its onset with a short
// shake that dies in 0.25 s, and a white flash frame on impact.
export function strike(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  if (t < w.start) return adv;
  const u = t - w.start;
  const k = ease.out5(u / 0.09);
  const sh = Math.exp(-u * 18) * Math.sin(u * 90) * px * 0.06 * (o.shake ?? 1);
  const sc = 1 + (1 - k) * (o.from ?? 0.9);
  const cx = x + adv / 2;
  ctx.save();
  ctx.translate(cx + sh, y + sh * 0.4); ctx.rotate((1 - k) * (o.rot ?? -0.12)); ctx.scale(sc, sc);
  paint(ctx, w.w, -adv / 2 + px * 0.13, 0, px, { ...o, alpha: (o.alpha ?? 1) * clamp01(k * 1.5) });
  if (u < 0.05 && (o.flash ?? true)) paint(ctx, w.w, -adv / 2 + px * 0.13, 0, px, { ...o, ink: '255, 255, 255', alpha: 0.9 * (1 - u / 0.05) });
  ctx.restore();
  return adv;
}

// SLASH: the word appears already cut along a diagonal; the two halves slide apart along the cut
// and snap together on the onset (a blade stroke in reverse), leaving a thin cut line that fades.
export function slash(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  if (t < w.start - 0.02) return adv;
  const u = t - w.start;
  const k = ease.out5((u + 0.02) / 0.09);
  const off = (1 - k) * px * 0.55;
  const ang = o.angle ?? -0.35;
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const cx = x + adv / 2, cy = y - px * 0.35;
  const half = (sign) => {
    ctx.save();
    ctx.beginPath();
    // half-plane on one side of the cut line through (cx, cy)
    const L = adv + px * 2;
    ctx.moveTo(cx - dx * L, cy - dy * L); ctx.lineTo(cx + dx * L, cy + dy * L);
    ctx.lineTo(cx + dx * L - dy * L * sign, cy + dy * L + dx * L * sign); ctx.lineTo(cx - dx * L - dy * L * sign, cy - dy * L + dx * L * sign);
    ctx.closePath(); ctx.clip();
    ctx.translate(dx * off * sign, dy * off * sign);
    paint(ctx, w.w, x, y, px, { ...o, alpha: (o.alpha ?? 1) * clamp01(k * 2) });
    ctx.restore();
  };
  half(1); half(-1);
  const line = clamp01(1 - u / 0.35);
  if (line > 0) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.85 * line).toFixed(3)})`; ctx.lineWidth = Math.max(2, px * 0.025);
    ctx.beginPath(); ctx.moveTo(cx - dx * adv * 0.7, cy - dy * adv * 0.7); ctx.lineTo(cx + dx * adv * 0.7, cy + dy * adv * 0.7); ctx.stroke();
  }
  return adv;
}

// GLITCH: the word is sliced into horizontal bands offset sideways (with a colour-split ghost);
// the offsets collapse to a clean word by 0.12 s after its onset. `hold` > 0 keeps a small live
// jitter afterwards on beats given in o.beats (seconds) for a hard pulse.
export function glitch(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  if (t < w.start) return adv;
  const u = t - w.start;
  let amt = 1 - ease.out3(u / 0.08);
  for (const b of o.beats ?? []) { const d = t - b; if (d >= 0 && d < 0.1) amt = Math.max(amt, 0.35 * (1 - d / 0.1)); }
  const bands = 7, top = y - px * 1.0, h = px * 1.25;
  for (let i = 0; i < bands; i++) {
    const seed = Math.floor(t * 30) * 13 + i;   // changes 30 times a second: frame-exact
    const sx = amt > 0.001 ? (hsh(seed) - 0.5) * px * 0.9 * amt : 0;
    ctx.save();
    ctx.beginPath(); ctx.rect(x - px, top + (h * i) / bands, adv + px * 2, h / bands + 1); ctx.clip();
    if (amt > 0.05) paint(ctx, w.w, x + sx - px * 0.04 * amt * 3, y, px, { ...o, ink: '0, 255, 170', alpha: 0.6 * amt });
    paint(ctx, w.w, x + sx, y, px, { ...o, alpha: (o.alpha ?? 1) * clamp01(u / 0.03 + 0.4) });
    ctx.restore();
  }
  return adv;
}

// LOCK-ON: a HUD reticle (four corner brackets) closes from wide onto the word as it is sung,
// with a small mono tag above it (o.tag, e.g. 'TARGET 01').
export function lockOn(ctx, w, t, x, y, px, o = {}) {
  const adv = measure(ctx, w.w, px, o);
  const pre = o.lead ?? 0.3;
  if (t < w.start - pre) return adv;
  const k = ease.out3((t - (w.start - pre)) / (pre + 0.1));
  const pad = px * (0.25 + 1.2 * (1 - k));
  const x0 = x - pad, x1 = x + adv - px * 0.26 + pad, y0 = y - px * 0.95 - pad * 0.6, y1 = y + px * 0.2 + pad * 0.6;
  const c = o.hud ?? '0, 255, 170';
  ctx.strokeStyle = `rgba(${c}, ${(0.9 * clamp01(k * 2)).toFixed(3)})`; ctx.lineWidth = Math.max(3, px * 0.03);
  const L = px * 0.35;
  ctx.beginPath();
  ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
  ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L);
  ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1);
  ctx.moveTo(x0 + L, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L);
  ctx.stroke();
  if (o.tag) { ctx.font = `800 ${Math.round(px * 0.22)}px "JetBrains Mono"`; ctx.fillStyle = `rgba(${c}, ${clamp01(k * 2).toFixed(3)})`; ctx.fillText(o.tag, x0, y0 - px * 0.12); }
  if (t >= w.start) strike(ctx, w, t, x, y, px, { ...o, from: 0.35, shake: 0.6 });
  return adv;
}

// (v2 has no redaction bars: redact is kept only as an alias of scan so old calls still work)
export function redact(ctx, w, t, x, y, px, o = {}) { return scan(ctx, w, t, x, y, px, o); }

// Lay a line out word by word with one weapon (or a function choosing per word), wrapping at maxW.
// weapon: strike | slash | glitch | lockOn | redact | (w, i) => fn
export function arm(ctx, words, t, weapon, { x = 240, y = 1500, px = 200, maxW = 3300, lead = 1.15, align = 'left', ...o } = {}) {
  const rows = [[]]; let rw = 0;
  for (const w of words) {
    const adv = measure(ctx, w.w, px, o);
    if (rw + adv - px * 0.26 > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push({ w, adv }); rw += adv;
  }
  let i = 0;
  rows.forEach((row, r) => {
    const total = row.reduce((a, b) => a + b.adv, 0) - px * 0.26;
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    for (const { w, adv } of row) {
      const fn = typeof weapon === 'function' && weapon.length === 2 && !weapon.name.match(/^(strike|slash|glitch|lockOn|redact|scan|term|misreg|fracture|cascade|buffer|ghost|volt)$/) ? weapon(w, i) : weapon;
      fn(ctx, w, t, cx, y + r * px * lead, px, o);
      cx += adv; i++;
    }
  });
}

// CARRY: a word sung across a cut belongs to the scene before it, but must still be readable
// 0.15 s after it is sung. Every lyric module calls this first: it draws, small and steady in the
// lower left, any word of the previous scene's last line that is sung within 0.3 s of this
// scene's start, holding it for 0.45 s after the word ends.
export function carry(ctx, t, P, { x = 240, y = 1960, px = 96, ground = 'dark' } = {}) {
  if (t > P.from + 0.8) return;
  const ws = lyrics.words.filter((w) => w.start < P.from + 0.02 && w.end > P.from - 0.3);
  if (!ws.length) return;
  const line = lyrics.lines.find((l) => l.start <= ws[0].start + 1e-3 && l.end >= ws[0].end - 1e-3);
  const words = line ? lyrics.words.filter((w) => w.start >= line.start - 1e-3 && w.end <= line.end + 1e-3) : ws;
  const a = 1 - clamp01((t - (ws[ws.length - 1].end + 0.45)) / 0.2);
  if (a <= 0.002) return;
  let cx = x;
  for (const w of words) cx += paint(ctx, w.w, cx, y, px, { alpha: a, ground });
}

// ---------- v2: system-generated type ----------
// Every idiom below: (ctx, w, t, x, y, px, opts) -> advance. Fully resolved by 0.1 s after the
// word's onset, still afterwards (the settle gate), and a stable (divine) word is never distorted.
const band = (ctx, x, y0, w, h, fn) => { ctx.save(); ctx.beginPath(); ctx.rect(x, y0, w, h); ctx.clip(); fn(); ctx.restore(); };

// SCAN: the word assembles from horizontal scanlines that arrive top to bottom, each line sliding in
// from a small offset, like a raster being written.
export function scan(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.03;
  if (u <= 0) return adv;
  const n = 12, top = y - px * 1.0, h = px * 1.25;
  for (let i = 0; i < n; i++) {
    const k = ease.out3((u - i * 0.004) / 0.06);
    if (k <= 0) continue;
    band(ctx, x - px, top + (h * i) / n, adv + px * 2, h / n + 0.8, () => paint(ctx, w.w, x + (1 - k) * px * 0.5 * (i % 2 ? 1 : -1), y, px, { ...o, alpha: (o.alpha ?? 1) * k }));
  }
  return adv;
}

// TERM: typed like terminal output, a character at a time across the word's first 0.08 s, with a
// block cursor while typing and a faint echo line above (the terminal echo).
export function term(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = clamp01(u / 0.08);
  band(ctx, x - px * 0.1, y - px * 1.1, (adv + px * 0.2) * k, px * 1.4, () => paint(ctx, w.w, x, y, px, o));
  if (k < 1) { ctx.fillStyle = `rgba(150, 255, 110, ${(o.alpha ?? 1).toFixed(3)})`; ctx.fillRect(x + (adv - px * 0.26) * k, y - px * 0.8, px * 0.12, px * 0.85); }
  const e = clamp01(1 - (u - 0.1) / 0.5);
  if (o.echo !== false && e > 0) paint(ctx, w.w, x, y - px * 0.9, px * 0.42, { ...o, voice: VOICES.cite, alpha: 0.35 * e * (o.alpha ?? 1) });
  return adv;
}

// MISREG: colour plates misregistered (magenta and green copies offset) that snap into register.
export function misreg(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = ease.out3(u / 0.09), d = (1 - k) * px * 0.18;
  if (d > 0.5) {
    paint(ctx, w.w, x - d, y, px, { ...o, ink: '255, 60, 170', alpha: 0.7 * (1 - k) });
    paint(ctx, w.w, x + d, y, px, { ...o, ink: '80, 255, 140', alpha: 0.7 * (1 - k) });
  }
  paint(ctx, w.w, x, y, px, { ...o, alpha: (o.alpha ?? 1) * clamp01(k * 1.4) });
  return adv;
}

// FRACTURE: the word arrives in three vertical shards displaced up and down, locking together.
export function fracture(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o), wd = adv - px * 0.26;
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = ease.out5(u / 0.09);
  for (let i = 0; i < 3; i++) band(ctx, x + (wd * i) / 3 - (i ? 0 : px), y - px * 1.2, wd / 3 + (i === 2 ? px : 0) + (i ? 0 : px), px * 1.6, () => paint(ctx, w.w, x, y + (1 - k) * px * 0.45 * (i - 1), px, { ...o, alpha: (o.alpha ?? 1) * clamp01(k * 1.5) }));
  return adv;
}

// CASCADE: letters drop into place one after another from above, fast, and land still.
export function cascade(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.03;
  if (u <= 0) return adv;
  const v = o.voice ?? voiceOf(w.w);
  let s = shown(w.w); if (v.caps) s = s.toUpperCase();
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = `${(v.track ?? 0) * size}px`;
  const per = Math.min(0.012, 0.06 / Math.max(1, s.length));
  let cx = x;
  for (let i = 0; i < s.length; i++) {
    const k = ease.out3((u - i * per) / 0.05);
    const cw = ctx.measureText(s[i]).width + (v.track ?? 0) * size;
    if (k > 0) { ctx.fillStyle = `rgba(${o.ink ?? v.color[o.ground === 'light' ? 1 : 0]}, ${((o.alpha ?? 1) * k).toFixed(3)})`; ctx.fillText(s[i], cx, y - (1 - k) * px * 0.6); }
    cx += cw;
  }
  ctx.letterSpacing = '0px';
  return adv;
}

// BUFFER: a thin loading bar under the word fills in the 0.4 s before it is sung (anticipation,
// no letters yet); on the onset the word appears whole and the bar flashes out.
export function buffer(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o), wd = adv - px * 0.26;
  const pre = clamp01((t - (w.start - 0.4)) / 0.4), post = clamp01((t - w.start) / 0.12);
  if (pre <= 0) return adv;
  const c = o.bar ?? '150, 255, 110';
  ctx.fillStyle = `rgba(${c}, ${(0.35 * (1 - post)).toFixed(3)})`; ctx.fillRect(x, y + px * 0.16, wd, Math.max(3, px * 0.03));
  ctx.fillStyle = `rgba(${c}, ${(0.95 * (1 - post)).toFixed(3)})`; ctx.fillRect(x, y + px * 0.16, wd * pre, Math.max(3, px * 0.03));
  if (t >= w.start - 0.02) paint(ctx, w.w, x, y, px, { ...o, alpha: (o.alpha ?? 1) * clamp01((t - w.start + 0.02) / 0.05) });
  return adv;
}

// GHOST: the word lands with two fading afterimages trailing to one side (a signal echo).
export function ghost(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const e = clamp01(1 - u / 0.45), dir = o.dir ?? 1;
  for (let i = 2; i >= 1; i--) if (e > 0.01) paint(ctx, w.w, x + dir * i * px * 0.22 * e, y, px, { ...o, alpha: 0.22 * e * (o.alpha ?? 1) / i });
  paint(ctx, w.w, x, y, px, { ...o, alpha: (o.alpha ?? 1) * clamp01(u / 0.05) });
  return adv;
}

// VOLT: voltage flicker: the word strobes on for two frames, off for one, then holds (for hits).
export function volt(ctx, w, t, x, y, px, o = {}) {
  if (steady(w, t, x, y, px, o, ctx)) return measure(ctx, w.w, px, o);
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const f = Math.floor(u * 60);
  const on = f >= 5 || f === 0 || f === 1 || f === 3;
  paint(ctx, w.w, x, y, px, { ...o, alpha: (o.alpha ?? 1) * (on ? 1 : 0.25) });
  return adv;
}

// DOSSIER: a machine label block: a mono header bar (o.head) over the words, set as a stacked file
// entry. words: the line's word objects; each word uses `weapon` (default scan).
export function dossier(ctx, words, t, { x = 240, y = 400, px = 150, head = 'FILE', weapon = scan, ground = 'dark', maxW = 1800, alpha = 1, ...o } = {}) {
  if (!words.length || t < words[0].start - 0.4) return;
  const k = ease.out3((t - (words[0].start - 0.4)) / 0.25);
  ctx.font = `800 ${Math.round(px * 0.26)}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.05}px`;
  const hw = ctx.measureText(head).width;
  ctx.fillStyle = `rgba(150, 255, 110, ${(0.9 * k * alpha).toFixed(3)})`;
  ctx.fillRect(x, y - px * 1.35, Math.max(hw + px * 0.4, maxW * 0.35) * k, px * 0.34);
  ctx.fillStyle = `rgba(8, 10, 12, ${(k * alpha).toFixed(3)})`;
  ctx.fillText(head, x + px * 0.12, y - px * 1.1);
  ctx.letterSpacing = '0px';
  arm(ctx, words, t, weapon, { x, y, px, maxW, ground, alpha, ...o });
}
