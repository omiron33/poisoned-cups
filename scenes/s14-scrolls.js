// 14 · "You kiss the scrolls / But your tongues call God a liar"
// Official text kept like a relic: a dark-glass document display standing in an edge-lit glass
// vitrine on a black plinth, rows of scripture glowing cold white. Beside it a synthetic
// spokesperson (a neon line profile, a hologram) talks in a soft white waveform; a talking-head
// screen smiles behind. On "kiss" the profile leans in and presses its lips to the glass over the
// document: a gold lip-print stays there. On "tongues" the same mouth opens and its waveform comes
// out forked, two magenta lie-signals cutting across the document's text (the words' layer strikes
// a red line through GOD where they cross it). On "liar" the frame tears for three frames.
import { grade, rgb, linesFrom, clamp01, ease, mix, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { CYBER_GLSL } from '/song/lib/x-cyber.js';
import { XF_GLSL } from '/song/lib/x-f.js';

const [L1, L2] = linesFrom('You kiss the scrolls', 'But your tongues');
const W = (L, k) => L.words.find((w) => w.w.toLowerCase().replace(/[^a-z]/g, '').startsWith(k));

// the document display's front (text plane) and where the mouth meets it
export const DOC = { c: [0.0, 1.45, 0.022], hw: 0.42, hh: 0.55 };
export const MOUTH = [-0.34, 1.43];          // lip-print / fork origin on the glass (x, y)
export const ROWS = { title: [1.9, 1.8], l2: [1.62, 1.43] };

export function rig(P) {
  const tKiss = W(L1, 'kiss').start, tT = W(L2, 'tongues').start, tLiar = W(L2, 'liar').start, tGod = W(L2, 'god').start;
  const camera = (t) => {
    const u = t - P.from;
    const k = ease.inOut3(u / (P.to - P.from));
    const d = 0.004 * Math.sin(t * 0.9);
    return { pos: [-0.14 + 0.04 * k + d, 1.47 + 0.02 * k, 2.0 - 0.16 * k], target: [-0.17 + 0.03 * k, 1.42, 0.0], fov: 38, roll: 0 };
  };
  return { camera, tKiss, tT, tLiar, tGod };
}

export default (P) => {
  const R = rig(P);
  return {
    name: 's14-scrolls', from: P.from, to: P.to,
    frag: STUDIO_GLSL + CYBER_GLSL + XF_GLSL + /* glsl */ `
uniform float uLean, uPrint, uOpen, uFork, uTear, uTalk, uSmile;
const vec3 DC = vec3(${DOC.c.join(', ')});
const vec2 DH = vec2(${DOC.hw}, ${DOC.hh});
const vec2 MO = vec2(${MOUTH.join(', ')});
float mapObj(vec3 p, out int id) {
  id = 1;
  // black lacquer plinth
  float d = sdRoundBox(p - vec3(0.0, 0.42, 0.0), vec3(0.62, 0.42, 0.38), 0.01);
  // the document display: a dark glass slab in a thin chrome frame on a foot
  float doc = sdRoundBox(p - vec3(DC.x, DC.y, 0.0), vec3(DH, 0.02), 0.004);
  if (doc < d) { d = doc; id = 3; }
  float fr = max(sdRoundBox(p - vec3(DC.x, DC.y, 0.0), vec3(DH + 0.02, 0.03), 0.006), -sdBox(p - vec3(DC.x, DC.y, 0.0), vec3(DH - 0.004, 0.1)));
  fr = min(fr, sdRoundBox(p - vec3(0.0, 0.87, 0.0), vec3(0.18, 0.03, 0.08), 0.01));
  if (fr < d) { d = fr; id = 2; }
  // the vitrine: edge-lit glass, drawn as its glowing edges
  vec3 e = abs(p - vec3(0.0, 1.47, 0.0)) - vec3(0.6, 0.62, 0.3);
  vec3 ee = max(e, -0.0);
  float edges = min(min(length(e.xz), length(e.xy)), length(e.yz));
  float box = sdBox(p - vec3(0.0, 1.47, 0.0), vec3(0.6, 0.62, 0.3));
  edges = max(edges, box - 0.001) - 0.004;
  if (edges < d) { d = edges; id = 4; }
  // a talking-head screen behind to the right
  float sc = sdRoundBox(p - vec3(1.0, 1.35, -0.7), vec3(0.34, 0.46, 0.02), 0.01);
  sc = min(sc, sdCapsule(p, vec3(1.0, 0.0, -0.74), vec3(1.0, 0.9, -0.74), 0.025));
  if (sc < d) { d = sc; id = 5; }
  return d;
}
Mat material(int id, vec3 p, vec3 n) {
  if (id == 2) { Mat m = CHROME(); m.rough = 0.12; return m; }
  if (id == 4) { Mat m = M(vec3(0.1), 0.3, 0.0); m.emit = vec3(0.25, 2.2, 0.55); return m; }
  if (id == 3) {
    Mat m = M(vec3(0.012, 0.012, 0.018), 0.05, 0.0); m.clear = 1.0;
    if (n.z > 0.5) {
      vec2 f = p.xy - DC.xy;
      // rows of scripture in the lower half: fine cold-white glyph runs, justified, two columns
      float row = (f.y + 0.46) / 0.034;
      float ri = floor(row), rf = fract(row);
      float inRows = step(-0.46, f.y) * step(f.y, -0.06) * step(abs(f.x), 0.33) * step(0.06, abs(f.x));
      float glyph = step(0.3, hash12(vec2(floor(f.x * 160.0), ri))) * step(0.15, fract(f.x * 160.0));
      float lineM = smoothstep(0.25, 0.35, rf) * smoothstep(0.75, 0.65, rf) * glyph * inRows;
      // a hairline rule under the title and a faint seal mark
      float rule = smoothstep(0.0025, 0.0, abs(f.y - 0.29)) * step(abs(f.x), 0.3);
      m.emit = vec3(0.55, 0.58, 0.7) * lineM * 0.7 + vec3(0.6, 0.62, 0.72) * rule * 0.8;
      m.emit *= scanlines(p.y * 1400.0, 1.0);
      // the voice waveform leaving the mouth, forking into two magenta lie-signals
      vec2 wu = vec2((p.x - MO.x) / (DH.x - MO.x + DC.x), (p.y - MO.y) / 0.16 + 0.5);
      if (wu.x > 0.0 && wu.x < 1.0 && wu.y > 0.0 && wu.y < 1.0) {
        float tr = waveTrace(wu, uTime, uFork);
        float reach = step(wu.x, 0.15 + uTalk + uFork * 1.2);
        vec3 wc = mix(vec3(0.7, 0.72, 0.85) * 0.6, vec3(3.2, 0.25, 1.4), gFork);
        m.emit += wc * tr * reach * (0.5 + 0.5 * uTalk + 1.5 * uFork);
      }
    }
    return m;
  }
  if (id == 5) {
    Mat m = M(vec3(0.02), 0.1, 0.0); m.clear = 1.0;
    if (n.z > 0.5 && abs(p.x - 1.0) < 0.32 && abs(p.y - 1.35) < 0.44) {
      vec2 uv = (p.xy - vec2(1.0, 1.38)) / 0.3;
      float f = neonFace(uv, uSmile, 0.0, 5.0);
      m.emit = (vec3(0.16, 0.05, 0.3) + vec3(1.6, 1.4, 2.4) * f) * scanlines(p.y * 900.0, 1.0);
    }
    return m;
  }
  Mat m = LACQUER(vec3(0.01, 0.01, 0.012)); m.rough = 0.1;
  return m;
}
// the spokesperson: a neon line profile facing right (+x), uv about -1..1; open lowers the jaw
float profileFace(vec2 uv, float open, float pucker) {
  float w = 0.022;
  vec2 j = vec2(0.0, -open * 0.16);
  float d = sdSeg2(uv, vec2(-0.05, 0.98), vec2(0.2, 0.78));
  d = min(d, sdSeg2(uv, vec2(0.2, 0.78), vec2(0.3, 0.42)));
  d = min(d, sdSeg2(uv, vec2(0.3, 0.42), vec2(0.27, 0.3)));
  d = min(d, sdSeg2(uv, vec2(0.27, 0.3), vec2(0.5, 0.02)));
  d = min(d, sdSeg2(uv, vec2(0.5, 0.02), vec2(0.34, -0.08)));
  vec2 ul = vec2(0.4 + pucker, -0.17);
  d = min(d, sdSeg2(uv, vec2(0.34, -0.08), ul));
  d = min(d, sdSeg2(uv, ul, vec2(0.31, -0.25)));
  vec2 ll = vec2(0.39 + pucker, -0.31) + j;
  d = min(d, sdSeg2(uv, vec2(0.31, -0.27) + j, ll));
  d = min(d, sdSeg2(uv, ll, vec2(0.3, -0.42) + j));
  d = min(d, sdSeg2(uv, vec2(0.3, -0.42) + j, vec2(0.33, -0.62) + j));
  d = min(d, sdSeg2(uv, vec2(0.33, -0.62) + j, vec2(0.05, -0.8) + j * 0.6));
  d = min(d, sdSeg2(uv, vec2(0.05, -0.8) + j * 0.6, vec2(-0.12, -1.2)));
  // back of the head and the nape
  d = min(d, sdArc2(uv, vec2(-0.3, 0.3), 0.66, 0.35, 3.0));
  d = min(d, sdSeg2(uv, vec2(-0.95, 0.35), vec2(-0.62, -0.62)));
  d = min(d, sdSeg2(uv, vec2(-0.62, -0.62), vec2(-0.55, -1.2)));
  // eye, brow, ear
  float fea = min(sdSeg2(uv, vec2(0.12, 0.32), vec2(0.23, 0.3)), sdSeg2(uv, vec2(0.08, 0.44), vec2(0.25, 0.43)));
  fea = min(fea, sdArc2(uv, vec2(-0.3, 0.05), 0.1, -1.4, 1.4));
  // the open mouth: a dark gap edged in light
  float m = max(stroke(d, w), stroke(fea, w * 0.8));
  return m * (0.72 + 0.28 * sin(uv.y * 140.0));
}
float lipPrint(vec2 s) {
  vec2 u = s * vec2(0.85, 2.1);
  float up = length(vec2(u.x, u.y - 0.28 - 0.12 * abs(u.x) + 0.15 * exp(-u.x * u.x * 30.0))) - 0.55;
  float lo = length(vec2(u.x * 0.95, u.y + 0.3)) - 0.52;
  float gap = abs(u.y + 0.02 + 0.03 * cos(u.x * 3.0));
  float grain = (0.55 + 0.45 * abs(sin(u.x * 22.0 + 0.4 * sin(u.y * 9.0)))) * (0.8 + 0.2 * vnoise(s * 40.0));
  return smoothstep(0.05, -0.03, min(up, lo)) * smoothstep(0.02, 0.07, gap) * grain;
}
vec3 shade(vec2 fc) {
  fc = glitchTear(fc, uTear);
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  vec3 col = studio(ro, rd, depth);
  // the hologram profile, floating in front of the vitrine glass
  float zf = 0.3 + 0.28 * (1.0 - uLean);
  float th = (zf - ro.z) / rd.z;
  if (th > 0.0 && th < depth) {
    vec3 hp = ro + rd * th;
    vec2 fcn = vec2(MO.x - 0.4 * 0.42 - 0.02 - 0.06 * (1.0 - uLean), MO.y + 0.4 * 0.24);
    vec2 uv = (hp.xy - fcn) / 0.42;
    if (abs(uv.x) < 1.3 && abs(uv.y) < 1.3) {
      float f = profileFace(uv, uOpen, 0.05 * uPrint * (1.0 - uOpen));
      col += vec3(1.3, 1.2, 2.2) * f * (0.8 + 0.2 * sin(uTime * 40.0 + hp.y * 30.0));
    }
  }
  // the gold lip-print left on the glass
  float tg = (0.3 - ro.z) / rd.z;
  if (uPrint > 0.0 && tg > 0.0 && tg < depth) {
    vec3 gp = ro + rd * tg;
    float lp = lipPrint((gp.xy - MO) / 0.058);
    col += vec3(1.5, 1.05, 0.42) * lp * uPrint;
  }
  return col;
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('58, 30, 86', 1.1), uCycB: rgb('12, 8, 22', 1.0),
      uFloorCol: rgb('40, 40, 48', 1.0), uFloorRough: 0.08, uFloorGrain: 1.5,
      uGrime: 0.85, uHaze: 0.06, uHazeCol: [0.05, 0.03, 0.08],
      uKeyDir: [0.3, 0.85, 0.5], uKeyCol: [1.4, 1.45, 1.7], uKeySize: 0.4,
      uRimA: [1.6, 0.5, 2.6], uRimB: [0.5, 2.4, 0.8],
      uP1: [1.4, 2.6, 1.4], uP1c: [0.3, 0.35, 0.6],
      uLean: 0, uPrint: 0, uOpen: 0, uFork: 0, uTear: 0, uTalk: 0, uSmile: 0.6,
    },
    camera: R.camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      // lean in to the glass for the kiss, then ease back; lean in again to speak the lie
      const inK = ease.inOut3((t - (R.tKiss - 0.3)) / 0.3), outK = ease.inOut3((t - (R.tKiss + 0.35)) / 0.5);
      const again = ease.inOut3((t - (R.tT - 0.35)) / 0.35);
      u.uLean.value = Math.max(inK * (1 - outK) , 0.55 * again) + 0.25 * outK * (1 - again);
      u.uPrint.value = clamp01((t - R.tKiss + 0.01) / 0.05);
      u.uOpen.value = clamp01((t - R.tT + 0.03) / 0.08) * (0.8 + 0.2 * Math.sin(t * 17));
      u.uFork.value = ease.out3((t - R.tT) / (R.tGod - R.tT));
      u.uTalk.value = clamp01((t - P.from) / 0.6) * (0.5 + 0.5 * Math.abs(Math.sin(t * 9))) * (t < R.tT ? 1 : 0.4);
      const tl = t - R.tLiar;
      u.uTear.value = tl >= 0 && tl < 0.06 ? 1 : 0;
      u.uSmile.value = 0.6 + 0.3 * Math.sin(t * 6);
    },
    post(t) { return grade(t, { exposure: 1.0, vignette: 0.5, bloom: 0.1 }); },
  };
};
