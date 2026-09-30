# Authoring scenes for Poisoned Cups

Read `docs/BRIEF.md` first (the idea, palette, voices and the scene table). This file is how to
write a scene. A worked example is `scenes/s01-poison.js` with `scenes/s01-poison.lyric.js`.

## Files

Each scene is two modules in `scenes/`:

- `<name>.js`: the picture. Default export `(P) => ({ name, from: P.from, to: P.to, frag, uniforms,
  camera(t), update?(t, u), textPlane(t, cam), post?(t) })`. `frag` is `STUDIO_GLSL` (from
  `/song/lib/studio.js`, plus `FLAME_GLSL` from `/song/lib/flame.js` and `#define FIRE` first if it has
  fire) followed by your `mapObj`, `material` and `vec3 shade(vec2 fc)`. Look at s01-poison. The picture has
  **no words** in it. Give it a dummy `textPlane` like s01.
- `<name>.lyric.js`: the words, drawn on their own layer. Default export `(P) => ({ textSize: [3840, 2160],
  shade, textPlane(t, cam), drawText(ctx, t) })`. Import idioms from `/song/lib/type.js`.

Never use absolute song times. Everything is relative to `P.from` / `P.to` and to measured word and
line times from `linesFrom(...)` (first occurrence) or `linesAt(P.from - 1.5, ...)` (repeated lines,
such as the second chorus). The timing is measured, but cuts may still move by a beat, so
scenes must keep working when their window shifts.

Do not edit anything in `lib/` or other people's scenes. If you need a shared helper, keep it in your
own scene file or in a new file `lib/x-<your scene range>.js`. Do not touch the engine repository.

## The picture

- Studio uniforms (see `STUDIO_UNIFORMS` in lib/studio.js): backdrop `uCycA`/`uCycB`, floor colour
  and roughness, key softbox direction/colour/size, two coloured strip lights `uRimA`/`uRimB`, two
  point lights `uP1`/`uP2` with colours (for flames, screens, lamps), `uExpo`. All colours linear:
  use `rgb('r, g, b', k)` from look.js.
- Materials: `GOLD() SILVER() CHROME() BRASS() ROSEGOLD() LACQUER(c) SILK(c) GLASS(tint) M(albedo, rough, metal)`,
  with `emit`, `sheen`, `trans`, `clear` fields. Shapes: `sdTorus sdLink sdChain sdCyl sdRoundBox sdCoin sdBox
  sdSphere sdEllipsoid sdCapsule sdRoundCone smin smax revo(p)` plus noise (`vnoise fbm voronoiEdge hash*`).
- Flame: `candleFlame(p, base, h, r, seed)`, `flameField(p, cell, h, r, amp)`, `fireSheet(p, h, t)`
  return densities; with `#define FIRE` you provide `float fireDen(vec3 p)`. Put a point light at a
  flame so it lights the objects (uP1 with a warm colour) and let it flicker with the same time.
- Not too dark, ever. Every scene is lit like a studio with a coloured backdrop (aubergine, oxblood, verdigris, marble white,
  ember, white at the end), deep but lit. No black voids. No flat
  plain surfaces: the lacquer floor, grain, reflections and rims do that job; give objects texture.
- One object idea per scene, shot beautifully, moving from the first frame (the camera always
  drifts or pushes; objects move). Metaphor, not illustration. No people, no faces, no bodies, no
  sexualised shapes. No neon cyberpunk, glowing orbs, lens flares or particle nebulae.
- Physical motion: springs and eased moves, holds then snaps on the beat. No floaty drifting.
- **Keep it fast to render.** mapObj is called ~200 times per ray, and the floor reflection and
  shadows call it again. Keep mapObj to a handful of SDFs; use a bounding box/sphere test to skip
  expensive parts when far away; loops over at most ~10 items. Test cost: a still at 16 samples should
  take under ~4 s (render.mjs prints ms; at --samples 2 aim under ~1 s).
- Everything is a pure function of `t` (no Date, no Math.random). Use hashes of indices.

## The words

- Lyrics are the star. Each scene uses a **different** idiom and layout from its neighbours: vary size,
  position (top, bottom, left column, right column, centre, following an object), idiom (flow, slam,
  ringText, stamp, feed, receipt, split, hero, note) and invent scene-specific choreography where it
  fits (words falling with coins, words carved into a tablet, words on the grooves of a record,
  words in the slots of a vending machine: use `project(cam, worldPoint)` from look.js to pin words to
  objects, or a world-space `textPlane` so the camera moves past them).
- Every word appears on its measured onset (`arrive()`/`wordState`), never early. The whole scene's
  lines must be readable: at most two lines on screen at once; a line fades out when the next scene
  needs the space or at `P.to`.
- `ground: 'light'` for words over cream/white/marble, `'dark'` over dark or saturated areas. The
  voices then pick an ink with 4.5:1 contrast. Don't put light words over bright areas or dark words
  over dark ones; the measured gate fails that. Keep words inside a 200 px safe margin of the
  3840×2160 canvas, never overlapping each other or running together (the idioms space words).
- `shade` 0.3 to 0.6: the soft backing behind words. Use less on clean backgrounds.
- A small mono spec note per scene is welcome (LOT 09 · SIEVE · 24K · MATT 23:24), in the product-film
  voice, but never replacing lyrics and never invented lyric text.

## Test

From the engine's `photoreal` folder:

```
S=<path to this repository>
node $S/tools/params.mjs <scene> --times        # the scene's window and lines
node render.mjs stills --song $S --scene <scene> --params "$(node $S/tools/params.mjs <scene>)" --t <t1>,<t2> --samples 2 --out $S/out/dev
```

Then look at the PNGs with the Read tool. Keep
test renders small: two or three times per call, `--samples 2`, and no more than about four calls per
scene. Check: the object reads, the frame is lit (not dark), words are sharp, spaced, readable and
in the frame, and the scene differs from its neighbours.

## This song

- Voices in lib/type.js are this song's (divine, judgment, veneer, sin, mercy, cite, claim). For a
  word that should take a voice it doesn't get by default, pass `voice: VOICES.claim` (etc.) to
  `paint`, or draw it yourself with that voice's font.
- The grammar is outside then inside (docs/BRIEF.md): each scene shows the polished outside plainly
  first, then turns or moves inside on a beat to show what it hides.
- Repeated lines ("Brood of vipers", "You say") are found in order: use `linesAt(P.from - 0.6, ...)`
  so each chorus gets its own occurrence (linesFrom finds the first one in the song).
- The timing in data/lyrics.json is measured (forced alignment), not a placeholder.

## New for the grimy direction (read docs/BRIEF.md top and bottom)

- lib/studio.js: `uGrime` (0 lacquer .. 1 wet dirty concrete with mirror puddles), `uHaze` (per-metre
  density, 0.02 to 0.12) and `uHazeCol` (the haze's glow, brightens toward the key light), and in GLSL
  `grimeMask(p)` and `Mat dirty(Mat m, vec3 p, float k)` to put grime on any material.
  Light it hard from few sources: a fluorescent strip (uRimA/uRimB cold white), sodium orange,
  acid-green glow (uP1/uP2 or emissive), fire. Dark, but never murky, and the words always read.
- lib/type.js weapons: `strike`, `slash`, `glitch`, `lockOn`, `redact`, each `(ctx, w, t, x, y, px, opts)`,
  and `arm(ctx, words, t, weapon | (w, i) => weapon, { x, y, px, maxW, align, ...opts })` to lay out a
  line with them. See scenes/x-weapons.lyric.js. Use them for the hard hits (on kicks and key words)
  and mix with calmer idioms so it isn't frantic. Leave room: a lockOn bracket needs ~0.3 px padding
  round its word, so don't pack bracketed words tight against neighbours.
