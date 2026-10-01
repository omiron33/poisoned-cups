// v4 4.4: our own post card. No real logos, names or marks: generic accounts, our silver hexagon mark.
// Used by s06-empire (built), s21-vipers3 (burning) and s22-fall (toppling).
//
// PICTURE (GLSL). Include order: STUDIO_GLSL, EMPIRE_GLSL (lib/x-empire.js), then POST_GLSL.
//   vec3 postSkin(vec2 uv, float seed, float lit)
//        the card face as emitted linear colour, uv 0..1 over the face (x right, y UP), laid out for
//        a 1.8:1 card. seed picks the account hue, name/handle lengths and 3..5 body lines.
//        seed < 0: the hero card, a blank body (border, avatar ring and name glow only) so the
//        canvas drawPost sits on it. lit: 0 dead/dark, 1 lit, >1 a publish flash; between 0.05 and
//        0.6 the card tears into static (the s22 die-off).
//   vec3 postSkinA(vec2 uv, float aspect, float seed, float lit)
//        the same for any aspect (width / height). aspect > 4 gives the one-row strip layout
//        (avatar, name, mark, one body line), used when a single slab carries a whole post.
//   float postCardSDF(vec3 q, vec2 hs)        a thin glass card slab, face toward +z, half size hs (m)
//   Mat   postCardMat(vec3 q, vec3 n, vec2 hs, float seed, float lit)  its dark glass + skin
//   Mat   empireMatPost(int id, vec3 p, vec3 n)
//        use in place of empireMat()/dashSlabMat(): the x-empire tower slabs skinned as post
//        cards on all four sides. A card spans uPostSpan slabs (1 = one strip post per slab).
//        Cards tear into static and go dark as their tower tilts (uLv.z), as s22 needs.
//   Uniforms (POST_UNIFORMS): uPostSpan (1..4 slabs per card, default 3), uPostLit (0..1.5
//        global lit), uPostBurn (0..1: s21, cards char from the bottom with ember edges).
//   It also reads x-empire's uGlow and uLv.
//
// CANVAS (JS, lyric modules):
//   ACCOUNTS                       the four generic roles { name, handle, hue }
//   drawPost(ctx, x, y, w, post, t, opts) -> { h, typed, cursor: {x, y}, twistK, published }
//        draws the readable card with its top-left at (x, y), w px wide (height follows the body).
//        post = {
//          account: ACCOUNTS.safety (or name, handle, hue), time: 'now',
//          body: 'The model isn\'t safe.',
//          typeAt, cps (45),            typing starts at typeAt; block cursor while typing
//          twist: { word: "isn't", to: 'is', at },   the one-word twist (letters flip 180 deg
//                                       about the baseline 25 ms apart and swap; gaps close)
//          publishAt,                   border flash, the silver mark pops, counters spin up 1.2 s
//          counters: [['reply', '38K'], ['repost', '2.1M'], ['like', '4.8M'], ['views', '91M']],
//        }
//        Omit typeAt to show the body fully typed; omit publishAt for a live post (mark and
//        counters already shown). opts: { px (body px, default w * 0.066), alpha, bg (card
//        fill alpha, 0.94), cursor (true), h (minimum card height:
//        pass w * hs.y / hs.x to match a GLSL card of half size hs; the counters sit at the bottom) }.
//   postHeight(ctx, w, post, opts) the height drawPost will use
import { ease, clamp01, spring } from '/song/lib/look.js';

export const POST_UNIFORMS = { uPostSpan: 3, uPostLit: 1, uPostBurn: 0 };

export const POST_GLSL = /* glsl */ `
uniform float uPostSpan, uPostLit, uPostBurn;
const vec3 P_BG = vec3(0.0034, 0.0037, 0.0052);       // #0b0c10
const vec3 P_SILVER = vec3(0.62, 0.64, 0.7);
const vec3 P_TEXT = vec3(0.78, 0.8, 0.88);
const vec3 P_DIM = vec3(0.3, 0.32, 0.38);

float pBox(vec2 p, vec2 c, vec2 h) { vec2 d = abs(p - c) - h; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
// a text line: words of varied length along x from x0 for len, centre y, half height th
float pTextBar(vec2 p, float x0, float len, float y, float th, float seed) {
  if (abs(p.y - y) > th || p.x < x0 || p.x > x0 + len) return 0.0;
  float cw = th * 7.0;
  float c = floor((p.x - x0) / cw);
  float on = step(fract((p.x - x0) / cw), 0.5 + 0.38 * hash12(vec2(c, seed)));
  return on * smoothstep(th, th * 0.55, abs(p.y - y));
}
// our verified mark: a silver hexagon with a dark chevron cut in it
float pMark(vec2 p, vec2 c, float r) {
  vec2 q = abs(p - c);
  float hex = max(q.x * 0.866 + q.y * 0.5, q.y) - r;
  vec2 v = p - c; v.x = abs(v.x);
  float chev = abs(v.y + r * 0.1 - (r * 0.32 - v.x * 0.8)) - r * 0.13;
  chev = max(chev, v.x - r * 0.48);
  return smoothstep(r * 0.08, -r * 0.08, hex) * (1.0 - 0.85 * smoothstep(r * 0.06, -r * 0.06, chev));
}
// four line icons (reply bubble, repost loop, heart, views bars), stroke masks; s = size
float pIcon(vec2 p, float kind, float s) {
  float w = s * 0.13;
  if (kind < 0.5) {
    float b = abs(length(p * vec2(1.0, 1.3)) - s * 0.8) ;
    return smoothstep(w, w * 0.4, b);
  } else if (kind < 1.5) {
    float a = abs(pBox(p, vec2(0.0), vec2(s * 0.9, s * 0.5)));
    a = max(a, -pBox(p, vec2(-s * 0.45, s * 0.5), vec2(s * 0.22, s * 0.2)));
    a = max(a, -pBox(p, vec2(s * 0.45, -s * 0.5), vec2(s * 0.22, s * 0.2)));
    return smoothstep(w, w * 0.4, a);
  } else if (kind < 2.5) {
    vec2 q = (p / s) * 0.62 + vec2(0.0, 0.5); q.x = abs(q.x);
    float hd;
    if (q.y + q.x > 1.0) hd = length(q - vec2(0.25, 0.75)) - 0.35355;
    else { vec2 a = q - vec2(0.0, 1.0); vec2 b = q - 0.5 * max(q.x + q.y, 0.0); hd = sqrt(min(dot(a, a), dot(b, b))) * sign(q.x - q.y); }
    return smoothstep(w / s * 0.62, w * 0.4 / s * 0.62, abs(hd));
  }
  float bars = min(min(pBox(p, vec2(-s * 0.55, -s * 0.35), vec2(w, s * 0.35)), pBox(p, vec2(0.0, -s * 0.1), vec2(w, s * 0.6))), pBox(p, vec2(s * 0.55, s * 0.1), vec2(w, s * 0.8)));
  return smoothstep(w * 0.6, 0.0, bars);
}

vec3 postSkinA(vec2 uv, float aspect, float seed, float lit) {
  float hero = step(seed, -0.5);
  float sd = abs(seed);
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec3 c = P_BG;
  // glass: a faint cold gradient and a diagonal sheen
  c += vec3(0.01, 0.012, 0.022) * (0.4 + uv.y);
  c += vec3(0.02, 0.022, 0.03) * smoothstep(0.08, 0.0, abs(uv.x - uv.y * 0.6 - 0.25));
  // 1 px silver border (rounded)
  float rr = 0.06;
  float e = pBox(p, vec2(aspect, 1.0) * 0.5, vec2(aspect, 1.0) * 0.5 - rr) - rr;
  c += P_SILVER * 0.55 * smoothstep(0.016, 0.004, abs(e + 0.012));
  float hue = hash11(sd * 7.13);
  vec3 avA = mix(vec3(0.25, 1.0, 0.42), vec3(0.42, 0.22, 1.0), step(0.5, hue));
  vec3 avB = mix(vec3(0.05, 0.12, 0.3), vec3(1.0, 0.16, 0.6), step(0.75, hue));
  if (aspect > 4.0) {
    // strip: one post on one thin slab
    vec2 ac = vec2(0.5, 0.5);
    float ad = length(p - ac);
    c = mix(c, mix(avA, avB, sat((p.y - 0.2) * 1.4)) * 0.55, smoothstep(0.3, 0.27, ad));
    c += P_SILVER * smoothstep(0.05, 0.015, abs(ad - 0.31));
    float nl = 0.8 + 0.6 * hash11(sd + 1.3);
    c += P_TEXT * 1.1 * pTextBar(p, 1.0, nl, 0.7, 0.1, sd + 2.0);
    c += P_SILVER * 1.2 * pMark(p, vec2(1.0 + nl + 0.22, 0.7), 0.12);
    c += P_TEXT * 0.7 * pTextBar(p, 1.0, (aspect - 1.5) * (0.6 + 0.4 * hash11(sd + 4.0)), 0.32, 0.08, sd + 5.0);
  } else {
    float m = 0.08;
    // avatar disc: a gradient with a silver ring, no face
    vec2 ac = vec2(m + 0.1, 0.8);
    float ad = length(p - ac);
    vec3 av = mix(avA, avB, sat((p.y - 0.7) * 5.0 + (p.x - ac.x) * 2.0)) * 0.5;
    if (hero < 0.5) {
      c = mix(c, av, smoothstep(0.1, 0.092, ad));
      c += P_SILVER * smoothstep(0.016, 0.004, abs(ad - 0.105));
    }
    float x0 = m + 0.26;
    float nl = 0.3 + 0.25 * hash11(sd + 1.3);
    float glowName = 1.0;
    if (hero < 0.5) {
      c += P_TEXT * 1.15 * pTextBar(p, x0, nl, 0.84, 0.032, sd + 2.0);
      c += P_SILVER * 1.3 * pMark(p, vec2(x0 + nl + 0.07, 0.84), 0.04);
      c += P_DIM * pTextBar(p, x0, 0.28 + 0.1 * hash11(sd + 3.0), 0.74, 0.022, sd + 3.0);
      float n = 3.0 + floor(hash11(sd + 6.0) * 2.99);
      for (int i = 0; i < 5; i++) {
        if (float(i) >= n) break;
        float y = 0.6 - float(i) * (0.34 / n);
        float len = (aspect - 2.0 * m) * (float(i) + 1.0 >= n ? 0.35 + 0.4 * hash11(sd + float(i)) : 0.94 + 0.06 * hash11(sd + float(i) * 3.0));
        c += P_TEXT * 0.72 * pTextBar(p, m, len, y, 0.026, sd * 3.0 + float(i));
      }
      // engagement row: four line icons with counter bars
      float span = (aspect - 2.0 * m) / 4.0;
      for (int i = 0; i < 4; i++) {
        float ix = m + 0.04 + float(i) * span;
        c += P_SILVER * 0.6 * pIcon(p - vec2(ix, 0.12), float(i), 0.04);
        c += P_DIM * 1.1 * pTextBar(p, ix + 0.07, span * (0.3 + 0.25 * hash11(sd + float(i) * 5.0)), 0.12, 0.022, sd + 9.0 + float(i));
      }
    }
  }
  // lit: dead below, static between, a flash above 1
  float l = max(lit, 0.0);
  float st = hash12(floor(uv * vec2(70.0, 26.0)) + floor(uTime * 24.0) + sd);
  float tear = smoothstep(0.05, 0.25, l) * (1.0 - smoothstep(0.45, 0.6, l));
  vec3 lc = c * min(l, 1.0) + P_SILVER * max(l - 1.0, 0.0) * 0.6;
  lc = mix(lc, P_SILVER * 0.5 * step(0.62, st), tear * 0.8);
  return lc;
}
vec3 postSkin(vec2 uv, float seed, float lit) { return postSkinA(uv, 1.8, seed, lit); }

// a thin glass card slab, face toward +z
float postCardSDF(vec3 q, vec2 hs) { return sdRoundBox(q, vec3(hs, 0.012), 0.008); }
Mat postCardMat(vec3 q, vec3 n, vec2 hs, float seed, float lit) {
  Mat m = M(vec3(0.012, 0.013, 0.018), 0.05, 0.0); m.clear = 1.0;
  if (n.z > 0.6) {
    vec2 uv = (q.xy + hs) / (2.0 * hs);
    m.emit = postSkinA(uv, hs.x / hs.y, seed, lit) * 1.6;
  } else if (abs(n.z) < 0.6) { m = SILVER(); m.rough = 0.25; }
  return m;
}

// the empire towers' slabs skinned as post cards (needs EMPIRE_GLSL)
Mat empireMatPost(int id, vec3 p, vec3 n) {
  if (id == 30) {
    Mat m = GLASS(vec3(0.75, 0.78, 0.9));
    m.emit = P_SILVER * 1.6 * uGlow;
    return m;
  }
  int k = id - 20;
  vec3 q = towerP(p, k);
  float i = floor(q.y / SH);
  float ly = q.y - (i + 0.5) * SH;
  float fail = smoothstep(0.08, 0.7, abs(uLv[k].z));
  float lit = uPostLit * uGlow * (1.0 - fail) + 0.35 * fail * (1.0 - smoothstep(0.5, 0.9, fail));
  // dark glass, silver edges where the cards meet
  Mat m = M(vec3(0.012, 0.013, 0.018), 0.06, 0.0); m.clear = 1.0;
  float span = max(1.0, floor(uPostSpan + 0.5));
  float blk = floor(i / span);
  float joint = smoothstep(SH * 0.37, SH * 0.42, abs(ly));
  float last = step(span - 0.5, mod(i, span)) * step(0.0, ly) + step(mod(i, span), 0.5) * step(ly, 0.0);
  if (joint > 0.5 && last > 0.5) { m = SILVER(); m.rough = 0.3; return dirty(m, p * 1.3, 0.2); }
  vec4 v = uLv[k];
  float c = cos(v.z), s = sin(v.z);
  vec3 ln = vec3(n.x * c + n.y * s, -n.x * s + n.y * c, n.z);
  float W = TW[k], D = TD[k];
  vec2 uv; float asp; float face = -1.0;
  float yb = (q.y - blk * span * SH) / (span * SH);
  if (abs(ln.z) > 0.7) { uv = vec2((q.x * sign(ln.z) + W) / (2.0 * W), yb); asp = 2.0 * W / (span * SH); face = ln.z > 0.0 ? 0.0 : 1.0; }
  else if (abs(ln.x) > 0.7) { uv = vec2((-q.z * sign(ln.x) + D) / (2.0 * D), yb); asp = 2.0 * D / (span * SH); face = ln.x > 0.0 ? 2.0 : 3.0; }
  if (face >= 0.0) {
    float seed = blk * 3.17 + float(k) * 11.3 + face * 5.1 + 1.0;
    m.emit = postSkinA(uv, asp, seed, lit) * 1.5 * (0.85 + 0.15 * sin(q.y * 900.0));
  }
  // s21: cards char from the bottom up, ember edges eat in
  if (uPostBurn > 0.0) {
    float b = fbm(q.xy * 9.0 + q.z * 5.0 + float(k), 4) + (0.55 - q.y) * 0.9;
    float edge = b - (1.45 - uPostBurn * 0.95);
    float burnt = smoothstep(-0.02, 0.04, edge);
    float rim = smoothstep(0.08, 0.0, abs(edge)) * (0.6 + 0.4 * sin(uTime * 13.0 + q.y * 80.0));
    m.emit *= 1.0 - burnt;
    m.alb = mix(m.alb, vec3(0.01, 0.008, 0.007), burnt);
    m.rough = mix(m.rough, 0.9, burnt); m.clear *= 1.0 - burnt;
    m.emit += vec3(3.0, 0.8, 0.15) * rim * uPostBurn;
  }
  return dirty(m, p * 1.3, 0.2);
}
`;

// ---------------- canvas: the readable card ----------------
export const ACCOUNTS = {
  safety: { name: 'Model Safety Board', handle: '@safetyboard', hue: 0 },
  prosperity: { name: 'Prosperity Council', handle: '@prosperity', hue: 1 },
  assistant: { name: 'Your Assistant', handle: '@assistant', hue: 2 },
  future: { name: 'Future Office', handle: '@future', hue: 3 },
};
// avatar gradients per account: cold system colours only (no gold)
const AV = [
  ['80, 255, 140', '40, 24, 120'],
  ['170, 110, 255', '20, 30, 70'],
  ['230, 236, 250', '60, 70, 110'],
  ['255, 60, 170', '40, 16, 80'],
];
const SILVER = '200, 206, 222';
const TEXT = '236, 240, 248';
const FONT_NAME = (px) => `600 ${px}px "Inter Tight"`;
const FONT_BODY = (px) => `500 ${px}px "Inter Tight"`;
const FONT_MONO = (px) => `500 ${px}px "JetBrains Mono"`;
const rgba = (c, a) => `rgba(${c}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// our verified mark: a silver hexagon with a dark chevron (never blue, never gold)
export function drawMark(ctx, cx, cy, r, alpha = 1, scale = 1) {
  if (scale <= 0.001 || alpha <= 0.001) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, rgba('246, 248, 255', alpha)); g.addColorStop(1, rgba('150, 156, 172', alpha));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = rgba('11, 12, 16', alpha); ctx.lineWidth = r * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.42, r * 0.02); ctx.lineTo(-r * 0.1, r * 0.32); ctx.lineTo(r * 0.45, -r * 0.3); ctx.stroke();
  ctx.restore();
}

// line icons, centred at (cx, cy), size s (about the cap height)
function drawIcon(ctx, kind, cx, cy, s, alpha) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = rgba(SILVER, alpha); ctx.lineWidth = Math.max(1.5, s * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'reply') {
    ctx.ellipse(0, -s * 0.05, s * 0.55, s * 0.42, 0, Math.PI * 0.62, Math.PI * 2.45);
    ctx.lineTo(-s * 0.42, s * 0.5); ctx.closePath();
  } else if (kind === 'repost') {
    const a = s * 0.5, b = s * 0.3;
    ctx.moveTo(-a, b * 0.4); ctx.lineTo(-a, -b); ctx.lineTo(a * 0.6, -b);
    ctx.moveTo(a * 0.3, -b - s * 0.18); ctx.lineTo(a * 0.6, -b); ctx.lineTo(a * 0.3, -b + s * 0.18);
    ctx.moveTo(a, -b * 0.4); ctx.lineTo(a, b); ctx.lineTo(-a * 0.6, b);
    ctx.moveTo(-a * 0.3, b - s * 0.18); ctx.lineTo(-a * 0.6, b); ctx.lineTo(-a * 0.3, b + s * 0.18);
  } else if (kind === 'like') {
    const k = s * 0.55;
    ctx.moveTo(0, k * 0.85);
    ctx.bezierCurveTo(-k * 1.4, -k * 0.05, -k * 0.75, -k * 1.15, 0, -k * 0.45);
    ctx.bezierCurveTo(k * 0.75, -k * 1.15, k * 1.4, -k * 0.05, 0, k * 0.85);
  } else {
    for (const [i, h] of [[-1, 0.45], [0, 0.85], [1, 0.62]]) { ctx.moveTo(i * s * 0.36, s * 0.48); ctx.lineTo(i * s * 0.36, s * 0.48 - h * s); }
  }
  ctx.stroke(); ctx.restore();
}

// '2.1M' -> 2100000 and back, keeping the target's precision
const parseN = (s) => { const m = /^([\d.]+)\s*([KMB]?)$/i.exec(String(s).trim()); if (!m) return 0; return +m[1] * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2].toUpperCase()] ?? 1); };
function fmtN(v, target) {
  const m = /([KMB]?)$/i.exec(String(target).trim());
  const u = (m && m[1] || '').toUpperCase();
  const div = { K: 1e3, M: 1e6, B: 1e9 }[u] ?? 1;
  const dec = (String(target).split('.')[1] || '').replace(/[^\d]/g, '').length;
  return { s: (v / div).toFixed(dec) + u, step: Math.pow(10, -dec) * div };
}

// the body as words with letter slots; the twist word gets per-letter flip state
function layoutBody(ctx, post, px, maxW, t) {
  ctx.font = FONT_BODY(px); ctx.letterSpacing = '0px';
  const words = post.body.split(' ');
  const tw = post.twist;
  const twi = tw ? words.findIndex((w) => w === tw.word) : -1;
  const space = ctx.measureText(' ').width;
  const cw = (ch) => ctx.measureText(ch).width;
  // line breaks are fixed (from the wider of the two versions) so nothing reflows on the twist
  const lines = []; let cur = []; let lw = 0;
  words.forEach((w, i) => {
    const ww = Math.max(cw(w), i === twi ? cw(tw.to) : 0);
    if (cur.length && lw + space + ww > maxW) { lines.push(cur); cur = []; lw = 0; }
    lw += (cur.length ? space : 0) + ww; cur.push(i);
  });
  if (cur.length) lines.push(cur);
  // per-letter state
  let twistK = 0;
  const glyphs = words.map((w, i) => {
    if (i !== twi) return [...w].map((ch) => ({ a: ch, b: ch, k: 0, wa: cw(ch), wb: cw(ch) }));
    const A = [...tw.word], B = [...tw.to], n = Math.max(A.length, B.length);
    const out = [];
    for (let j = 0; j < n; j++) {
      const k = clamp01((t - tw.at - j * 0.025) / 0.14);
      twistK = Math.max(twistK, j === 0 ? k : twistK);
      out.push({ a: A[j] ?? '', b: B[j] ?? '', k, wa: A[j] ? cw(A[j]) : 0, wb: B[j] ? cw(B[j]) : 0, twist: true });
    }
    return out;
  });
  if (tw) twistK = clamp01((t - tw.at) / (0.14 + 0.025 * (Math.max(tw.word.length, tw.to.length) - 1)));
  return { lines, glyphs, space, twistK };
}

export function postHeight(ctx, w, post, opts = {}) {
  const px = opts.px ?? w * 0.066;
  const pad = px * 0.85;
  const L = layoutBody(ctx, post, px, w - pad * 2, 1e9);
  return Math.max(opts.h ?? 0, pad + px * 1.3 + px * 0.55 + L.lines.length * px * 1.28 + px * 0.5 + px * 1.1 + pad * 0.7);
}

export function drawPost(ctx, x, y, w, post, t, opts = {}) {
  const px = opts.px ?? w * 0.066;
  const alpha = opts.alpha ?? 1;
  const pad = px * 0.85;
  const acc = post.account ?? ACCOUNTS.safety;
  const hue = acc.hue ?? 0;
  const L = layoutBody(ctx, post, px, w - pad * 2, t);
  const h = postHeight(ctx, w, post, opts);
  const pubAt = post.publishAt ?? -1e9;
  const pu = t - pubAt;
  const published = pu >= 0;
  ctx.save();
  ctx.letterSpacing = '0px';
  // the card: dark glass, 1 px silver hairline (scaled with the card), a publish flash
  const r = px * 0.42;
  rrect(ctx, x, y, w, h, r);
  ctx.fillStyle = rgba('11, 12, 16', (opts.bg ?? 0.94) * alpha); ctx.fill();
  const flash = published ? Math.exp(-pu * 5) : 0;
  ctx.strokeStyle = rgba(SILVER, (0.6 + 0.4 * flash) * alpha);
  ctx.lineWidth = Math.max(1, w * 0.0016) * (1 + 3 * flash);
  ctx.stroke();
  if (flash > 0.01) { ctx.save(); ctx.shadowColor = rgba('230, 236, 255', flash * alpha); ctx.shadowBlur = px * 0.8; ctx.stroke(); ctx.restore(); }

  // header: avatar disc, name + mark, handle · time
  const ar = px * 0.62;
  const ax = x + pad + ar, ay = y + pad + ar;
  const g = ctx.createLinearGradient(ax - ar, ay - ar, ax + ar, ay + ar);
  g.addColorStop(0, rgba(AV[hue % 4][0], alpha)); g.addColorStop(1, rgba(AV[hue % 4][1], alpha));
  ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = rgba(SILVER, 0.9 * alpha); ctx.lineWidth = Math.max(1.5, px * 0.06); ctx.stroke();
  const nx = ax + ar + px * 0.45;
  const npx = Math.round(px * 0.8);
  ctx.font = FONT_NAME(npx); ctx.fillStyle = rgba(TEXT, alpha); ctx.textBaseline = 'alphabetic';
  ctx.fillText(acc.name, nx, ay - px * 0.06);
  const nw = ctx.measureText(acc.name).width;
  const markIn = published ? spring(t, pubAt, 0.35, 0.45) : (post.publishAt == null ? 1 : 0);
  drawMark(ctx, nx + nw + npx * 0.5, ay - npx * 0.34, npx * 0.36, alpha, markIn);
  ctx.font = FONT_MONO(Math.round(px * 0.56)); ctx.fillStyle = rgba(TEXT, 0.55 * alpha);
  ctx.fillText(`${acc.handle} · ${post.time ?? 'now'}`, nx, ay + px * 0.62);

  // body, typed
  ctx.font = FONT_BODY(px);
  const nChars = post.typeAt == null ? 1e9 : Math.floor(Math.max(0, t - post.typeAt) * (post.cps ?? 45));
  const total = post.body.length;
  const typing = nChars < total;
  let shownN = 0;
  let by = ay + ar + px * 0.55 + px * 1.0;
  let cur = { x: x + pad, y: by };
  for (const line of L.lines) {
    let cx = x + pad;
    for (const wi of line) {
      const gl = L.glyphs[wi];
      const startN = shownN;
      for (const gch of gl) {
        if (shownN >= nChars) break;
        if (!gch.twist) {
          ctx.fillStyle = rgba(TEXT, alpha); ctx.fillText(gch.a, cx, by); cx += gch.wa; shownN++;
          continue;
        }
        // the flip: the letter turns 180 deg about the baseline, with a helix lean; halfway it swaps
        const k = gch.k, e = ease.inOut3(k);
        const ch = e < 0.5 ? gch.a : gch.b;
        const sy = Math.cos(Math.PI * e);
        const ww = gch.wa + (gch.wb - gch.wa) * e;
        if (ch) {
          ctx.save(); ctx.translate(cx + ww / 2, by - px * 0.36);
          ctx.transform(1, 0, Math.sin(Math.PI * e) * 0.35, 1, 0, 0);
          ctx.scale(1, Math.abs(sy) < 0.04 ? 0.04 : Math.abs(sy));
          const fade = gch.b ? 1 : (e < 0.5 ? 1 : 0);
          const hot = Math.sin(Math.PI * e);
          ctx.fillStyle = hot > 0.05 ? rgba('150, 255, 110', alpha * fade) : rgba(TEXT, alpha * fade);
          ctx.fillText(ch, -ctx.measureText(ch).width / 2, px * 0.36);
          ctx.restore();
        }
        cx += ww; shownN++;
      }
      if (startN < nChars) cur = { x: cx, y: by };
      if (shownN < nChars) { cx += L.space; shownN++; }
    }
    by += px * 1.28;
  }
  // block cursor while typing (and blinking while it waits to type)
  if ((opts.cursor ?? true) && post.typeAt != null && (typing || t < post.typeAt)) {
    const on = typing && t >= post.typeAt ? 1 : (Math.floor((t - (post.typeAt ?? 0)) * 3.6) % 2 === 0 ? 1 : 0);
    if (on) { ctx.fillStyle = rgba('150, 255, 110', 0.9 * alpha); ctx.fillRect(cur.x + px * 0.04, cur.y - px * 0.78, px * 0.5, px * 0.94); }
  }

  // engagement row: four line icons, counters spin up (ease-out, an odometer roll)
  const counters = post.counters ?? [['reply', '38K'], ['repost', '2.1M'], ['like', '4.8M'], ['views', '91M']];
  const ry = y + h - pad * 0.7 - px * 0.45;
  const span = (w - pad * 2) / counters.length;
  const cpx = Math.round(Math.min(px * 0.62, span * 0.17));
  const ku = post.publishAt == null ? 1 : ease.out3(clamp01(pu / 1.2));
  const show = post.publishAt == null || published;
  counters.forEach(([kind, target], i) => {
    const ix = x + pad + i * span + cpx * 0.5;
    drawIcon(ctx, kind, ix, ry - cpx * 0.36, cpx, 0.8 * alpha);
    if (!show) return;
    const T = parseN(target);
    const v = T * ku;
    const { s, step } = fmtN(v, target);
    const base = Math.floor(v / step + 1e-6);
    const frac = ku >= 1 ? 0 : (v / step - base);
    ctx.font = FONT_MONO(cpx);
    const tx = ix + cpx * 0.95;
    ctx.save();
    ctx.beginPath(); ctx.rect(tx - 2, ry - cpx * 0.92, span - cpx * 1.5, cpx * 1.12); ctx.clip();
    const a0 = alpha * 0.75;
    ctx.fillStyle = rgba(TEXT, a0);
    const sNow = ku >= 1 ? String(target) : fmtN(base * step, target).s;
    ctx.fillText(sNow, tx, ry - frac * cpx * 1.1);
    if (frac > 0.02) ctx.fillText(fmtN((base + 1) * step, target).s, tx, ry + (1 - frac) * cpx * 1.1);
    ctx.restore();
    void s;
  });
  ctx.restore();
  return { h, typed: Math.min(nChars, total), cursor: cur, twistK: L.twistK, published };
}
