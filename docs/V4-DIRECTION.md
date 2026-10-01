# Poisoned Cups v4: scene direction

This is the build brief for the render thread ("Brood of Vipers") on the Mac. It covers all 27 scenes. It was written from the author's v3 notes (2026-10-01 02:31Z) and a read-only study of `omiron33/poisoned-cups` at tag v3.

**How to read it**

- Section 2 says which of the author's notes is fixed where.
- Sections 3 and 4 are film-wide rules and the new shared code to build first.
- Section 5 is the v4 timing.
- Section 6 goes scene by scene.
- Section 7 lists the exact text edits.
- Section 8 is the ordered task list.
- Section 9 is the acceptance check.

**Status codes used per scene**

| Code | Meaning |
|---|---|
| KEEP | The picture and text stay as v3. A KEEP scene may still re-render if its cut moved. |
| TEXT | Text layer edits only. |
| SWAP | The concept and camera stay. The picture re-renders with the new snakes, faces, hall or post skin from section 4. |
| REWORK | Part of the picture is rebuilt. The lyric layer is mostly kept. |
| REBUILD | New picture and new lyric layer. |

**Timing rule.** Word times come from `data/lyrics.json` (measured). They are quoted here so you can check stills. In code, everything stays relative to `P.from`/`P.to` and the measured words (`linesFrom` / `linesAt(P.from - 0.6, …)`). Never write absolute times.

---

## 1. The idea, one paragraph

This is Matthew 23 for the machine age. The ruling class of the AI era polishes the outside of the cup and keeps the poison in:

- the PR feed that edits the truth
- the camera that fines a man for a step off the kerb while the exempt convoy runs the light
- the AI guide that prices a widow's vulnerability
- the ethics officer that prays in public and executes in private
- the vision model that "sees" everything and is dark inside

Against them stands one thing that is never glitched: the warm light and the gold words of Christ. At the end, the people, not the machines, bring the stones down.

Keep it glitchy, shadow-punk, grimy and futuristic: glass, depth, volumetric light, holographic data. Nothing 80s, nothing 8-bit, no smiley faces.

---

## 2. the author's v3 notes, and where each is fixed

| # | the author's note | v4 fix | Scenes |
|---|---|---|---|
| 1 | "Class" next to Matthew in the first scene | Done by you. Also remove the word CLASS from the s08, s16 and s24 labels (section 7). | s00 ✓, s08, s16, s24 |
| 2 | The gnat isn't intelligible. It should be small rule-breaking while the overlords do whatever they want. | A man steps off the kerb on red. AI cameras lock on and fine him. An exempt convoy then runs the red light while every camera turns away. | s09 REBUILD |
| 3 | Prior-scene words still show bottom left | Done by you. Keep it: no scene ever draws an earlier scene's words, and no line is split across a cut (section 5). | all |
| 4 | "Twist the truth" is just a spiral. Replace the scene with realistic X-style posts being typed that form an empire. | A safety post is typed true, then twisted into a lie with one word. Agent accounts amplify it, and the posts stack into an empire that stands on a phone. The same post towers burn in s21 and fall in s22. | s06 REBUILD, s21/s22 SWAP |
| 5 | The vipers in "Do you think I can't see still" don't look like snakes | New snake library. s08 gets cobras with hoods and no camera-lens snouts. Every viper scene changes. | s05 s08 s13 s16 s21 s24 s25 |
| 6 | Heavy loads: hard to make out the workers. Use shadowy faces laughing at the people's labour instead of floating things. | Big, lit workers in hi-vis. Giant shadowy glass faces loom in the haze above and laugh. | s10 REWORK |
| 7 | Widow pays: hard to tell the poor woman is paying while the overlords have riches | An old widow with a cane and shawl feeds her last two coins into an AI kiosk. They shoot up a pipe into a vault of silver hanging over her head, where the rich toast. | s11 REBUILD |
| 8 | Weird humanoid kissing a scroll. Show them professing goodness of Me while evil in thought and action. | The pious machine. From the front it bows over a book of light. From behind, hidden arms execute harm, and its glass head shows what it is really thinking. Its tongue forks, and it stamps God's word FALSE. | s14 REBUILD |
| 9 | Not sure what the darkness scene represents | The AI eye says WE SEE. The camera dives into its pupil and finds it dark inside, with one black box. (John 9:41) | s17 REBUILD |
| 10 | The cracked reed scene is weird, just a green reed | A broken worker kneels in the rubble and the disposal arm comes for them. On "I" the light stops it, and they lift their head. | s23 REBUILD |
| 11 | The stones must be smashed and fall, representing the people overthrowing | In s24 the crowd gathers and throws cables over the pylons. In s25 they pull the pylons down, the rigid vipers shatter, and the wall breaks open to the light. | s24 REWORK, s25 REBUILD |
| 12 | Lean into AI more explicitly | AI is the idea of s06 s07 s09 s10 s11 s12 s14 s17 s20 s22 s23, plus deadpan AI labels (section 3, rule 7) | see section 6 |
| 13 | Keep the glitchy shadow-punk, but no 8-bit, smiley, 80s look. More futuristic. | Every LED pixel face and pixel drip is retired. New glass and contour-scan faces, and modern glitch. | sections 3, 4 |
| 14 | In the poor-can't-walk-in scene the humanoids are hard to see again | Readable people, front-lit by the door, from a low 3/4 angle with scores on them | s20 REWORK |

---

## 3. Film-wide rules for v4

**Standing rules (unchanged):**

- **Code-only.** Raymarched pictures plus the canvas text layer, at 1080p60 with motion blur. No generated images or video.
- **Palette.** Toxic green, deep purple, cold white, black, silver, and occasional hot magenta. Gold is only for Christ's words (I, My, God) and the warm light that stands for Him.
- **Banned:**
  - gloves
  - clockwork or gears
  - ruins or stone monuments as the main look
  - redaction-bar reveals
  - flesh vipers
  - real people, real logos, real politicians
  - pdoom motifs: fuse spark, P(doom) counter, smile mask, loss curves, unicorn
- **The lyrics are the star.**
  - Each line has one obvious reading path.
  - Landed words never move. They hold still for at least 8 frames.
  - At most two lines are on screen. The previous line dims to about 45% when the next starts.
  - Contrast 4.5:1, 200 px safe margin, gaps of at least 0.3 × size.
  - Every word is resolved by onset + 0.1 s and still readable at end + 0.15 s.
- **Outside, then inside**, in every verse scene.
- **Camera.** Always moving. Holds, then snaps on the beat. No dead stops (spring, or an ease of at least 6 frames).

**New in v4:**

1. **No previous-scene words, ever.** Keep your fix: no `carry()` drawing, and no line split across a cut. The cut lands at least 0.2 s after a line's last word. Where the next line's first word starts before the cut (listed in section 5), the incoming scene draws that word fully formed on its first frame, with no build-in. The outgoing scene never draws it.
2. **Retire the 8-bit faces.** `neonFace`, `faceScreen`, `conciergeFace` and the hall's LED face wall go. Every machine face is the new glass head or contour-scan face (4.2). Nothing smiles with a drawn stroke, and no face is made of LED cells.
3. **Retire pixel-drip and blocky 8-bit corruption as the look of a glitch.** The v4 glitch vocabulary is:
   - datamosh smear (the image dragged along motion)
   - macroblock slips (8 to 32 px blocks sliding)
   - chroma split
   - depth-slice offset
   - rolling-shutter skew

   Use 2 to 4 frames on hits. Kept scenes keep their typography idioms.
4. **Vipers read as snakes first and cables second** (4.1): wedge head, slit eyes, heat pits, fangs, forked tongue, belly scutes, a real taper, and serpentine motion. Every pose must pass the thumbnail test. No lens snouts.
5. **People must read** (4.3):
   - Anyone who matters is at least 30% of frame height in their key shot.
   - Light them front or 3/4: a warm key on face and hands, plus a cold rim.
   - Never a black cut-out against a bright source.
   - The posture tells the story in silhouette.
6. **Warm means human, cold means system.** People's faces and hands take the warm key. Machines take cold white, green and magenta.
7. **AI labels are secondary text:**
   - mono (cite voice), 32 to 44 px, 70 to 85% alpha
   - at most two on screen at once
   - at least 0.3 × lyric size away from lyric words
   - never in gold, never invented lyric text

   They are deadpan, like a system log.
8. **Shared code.**
   - New code goes in new files (`lib/x-v4-*.js`).
   - Do not touch `studio.js`, `look.js` or `x-cyber.js`. s02 is the one scene that can keep its cached picture, and only if those three are unchanged.
   - Leave `x-viper.js`, `x-b.js` and `x-a.js` unchanged too, so v3 stays reproducible. s18 still uses `x-a.js`, and other scenes may keep using their non-face, non-viper helpers. Scenes switch to the v4 files only for snakes, faces and the hall.

---

## 4. New shared code: build and test these first

### 4.1 `lib/x-v4-snake.js` (SNAKE_GLSL): the new vipers

Use the same frame as `sdViper`: the body runs along +x from the tail (x = 0) to the head (x = L). Keep the same arguments so scenes can swap, and add two:

`float sdSnake(vec3 q, float L, float R, float amp, float k, float ph, float lift, float lp, float gape, float hood)`

**Body**
- Radius about 0.55 R at the neck just behind the head, full R at 30 to 45% of the length, tapering to about 0.12 R at the tail tip.
- Side-to-side undulation in the ground plane, with amplitude growing toward the tail. `ph` travels for slithering. `lift` raises the front third into an S for rearing.

**Head (a real viper head)**
- Seen from above, a wedge or arrowhead: about 1.8 × the neck width at the jaw hinge, narrowing to a blunt rounded snout. Flat crown.
- Raised brow ridges over the eyes.
- Eyes as slightly domed bumps on the sides, with an emissive vertical slit pupil (acid green; hot magenta in s21).
- A heat-pit dimple between eye and nostril, nostrils, and a clear jaw line.
- `gape` 0..1 drops the lower jaw to about 70° and swings two long chrome fangs forward.
- Keep the forked tongue and `gVipFlick` logic from x-viper.

**Hood** (0..1, for cobras)
- The neck flattens into a broad oval hood, 3 to 3.5 × the neck width, with rib ridges.
- On the back of the hood, an emissive camera-iris marking (concentric rings and aperture blades, cold white). That is where the surveillance idea lives now: the head stays a snake.

**Skin**
- Dorsal diamond/hex scale lattice (normal and roughness variation) in black gunmetal, with a faint cable braid under the scales.
- One thin emissive pinstripe down the spine, with acid-green pulses travelling head to tail (from v3).
- Wide pale-silver belly scutes.
- Head plates in black chrome with machined seams. `iron = 1` still turns it rigid steel (for s24/s25).

**Pose helpers**

| Pose | What it is | Used in |
|---|---|---|
| `coil` | Resting spiral, head on top | s05 |
| `rear` | Front third raised in an S, head level; with `hood` = cobra | s08, s21 |
| `strike` | Lunge plus gape | s13 |
| `wrap` | Helix round a vertical pillar, head rearing off the top; replaces `helixViper` | s13, s24, s25 |
| `pour` | Follows a curve over an edge and down | s16 |

**Cost.** A bounding capsule per snake, loops ≤ 10, about a third of the old viper's cost or less.

### 4.2 `lib/x-v4-head.js` (HEAD_GLSL): the machine face

**`float sdHead(vec3 q, float jaw, float tilt)`**
- A sculpted mannequin head and neck from smooth ellipsoids and `smin`: cranium, brow, soft eye sockets, nose wedge, cheekbones, lips, chin.
- The jaw is hinged near the ear. `jaw` 0..1 opens it to about 25°.
- No hair, no ear detail. Facing +z, chin at y = 0, crown at y = 1, scaled per scene.

**`Mat headMat(vec3 q, vec3 n, float live)`**
- Black obsidian glass: very dark albedo, clearcoat, low roughness.
- It carries a depth-contour scan: thin iso-lines of the head's depth, about 30 across the face, cold white at low intensity. The lines bend over nose, lips and brow, so the face reads as a 3D scan. A brighter band sweeps down it every couple of seconds.
- Eyes are blank glass (no pupils).
- `live = 0` freezes the scan and turns the lines hot magenta: the "caught" state.

**`vec3 faceScan(vec2 uv, float yaw, float mouth, float smile, float live, vec3 ink)`**
- The same face in 2D, for screens: an analytic face height field drawn as fine topographic contour lines, with the scan band and soft shading.
- `mouth` opens it. `smile` lifts the corners by deforming the field, never by a drawn curve.
- `live = 0` freezes it magenta.
- At least 60 lines per face height, so there are never visible LED cells.

### 4.3 `lib/x-v4-figure.js` (FIGURE_GLSL): readable people

**`float sdPerson(vec3 q, vec4 poseA, vec4 poseB, float kind)`**
- About 16 capsules and ellipsoids with `smin`: head, neck, chest, waist, pelvis, upper arms, forearms, mitten hands (no fingers, no gloves), thighs, shins, feet.
- The pose sets spine bend, head pitch, arms, elbows, hips, knees and lean.
- `kind` adds a garment:

  | kind | Garment |
  |---|---|
  | 0 | Plain |
  | 1 | Hoodie and backpack |
  | 2 | Hi-vis vest with retro-reflective stripes, and a hard hat |
  | 3 | Shawl over the head and shoulders, long skirt (the widow) |
  | 4 | Sharp suit |
  | 5 | Child (0.55 scale) |

**Poses needed**

| Scene | Poses |
|---|---|
| s09 | Mid-stride; frozen with shoulders up |
| s10 | Bowed under a load; buckling |
| s11 | Widow bent on a cane with a hand at the slot; standing with a raised glass |
| s17 | Crowd standing and looking up |
| s20 | Arms folded in a doorway; mother holding a child on her hip; old man holding out a cup; young man holding up a phone |
| s23 | Kneeling with one hand on the floor, head bowed, then head lifting |
| s24, s25 | Walking in; throwing a cable; leaning back pulling a rope |

**Materials**
- Matte fabric (rough about 0.8) in charcoal, olive or indigo.
- Skin patches on face and hands, warm brown or tan, so the warm key reads.
- Hi-vis stripes bright when lit from the camera side.

**Cost.** Test a bounding capsule first. Crowds use domain repetition with hashed pose variation (one person evaluated per cell).

### 4.4 `lib/x-v4-post.js`: our own post card

No real logos, names or marks.

**GLSL `vec3 postSkin(vec2 uv, float seed, float lit)`**, for slab faces:
- A dark glass card (#0b0c10) with a 1 px silver border.
- An avatar disc: a gradient with a silver ring, no face.
- Name and handle bars, and 3 to 5 text-line bars.
- An engagement row: four line icons with counter bars.
- Our verified mark: a small silver hexagon with a chevron. Never blue, never gold.

**GLSL `empireMatPost(...)`.** The x-empire tower slabs skinned with `postSkin` instead of the dashboard skins. Used by s06, s21 and s22.

**JS `drawPost(ctx, x, y, w, post, t, opts)`**, the readable card on the canvas:
- avatar
- name in Inter Tight 600, with the silver mark
- handle and time in JetBrains Mono at 55%
- body in Inter Tight 500, sentence case, with a block cursor while typing
- the twist animation (s06)
- counters with line icons spinning up (ease-out)

Accounts are generic roles:
- "Model Safety Board" @safetyboard
- "Prosperity Council" @prosperity
- "Your Assistant" @assistant
- "Future Office" @future

### 4.5 `lib/x-v4-hall.js`: the data hall without pixel faces

A copy of `x-a.js` where:
- The LED wall (id 42) shows one big, dim `faceScan` face: fine lines, no LED grid.
- The two angled screens (id 43) show smaller live `faceScan` faces watching the cup.

`uFreeze` freezes them magenta. The uniforms are the same (`uFaces`, `uFreeze`, `uHallGlow`), so s00, s01, s16 and s26 only change the import. s18 keeps `x-a.js`, because its faces are off.

### 4.6 Test gates (stills at `--samples 2`, 640×360, plus a 320×180 downscale)

- **Snake.** Every pose against a plain light backdrop. At 320×180 someone who has never seen the film says "snake": head clearly wider than the neck, eyes visible, body tapering. The cobra hood reads as a hood.
- **People.** Every pose in 4.3. At 320×180 the role reads: widow, worker under load, jaywalker, kneeling worker, rope puller, mother with child.
- **Face.**
  - The 3D head at front, 3/4 and profile, both closed and laughing.
  - `faceScan` both live and frozen.
  - Nothing reads as a cartoon, a smiley or LED pixels.
- **Post.** The hero card at 1080p reads at phone size.
- **Cost.** Each library's test still at 16 samples takes under about 4 s.

---

## 5. v4 timing (film.json)

Ten joins move. In v3, three of them split a word ("pays", "gate", "skill") and seven cut within 0.2 s of a line's last word. The cut is placed at the first frame at least 0.2 s after the last word ends. If your fixed windows differ by a frame, keep yours.

| # | Scene | From | To | Note |
|---|---|---|---|---|
| 00 | s00-cup | 0.0000 | 9.0667 | |
| 01 | s01-poison | 9.0667 | 15.0667 | |
| 02 | s02-fringes | 15.0667 | 20.5167 | |
| 03 | s03-tomb | 20.5167 | 25.9667 | end moved (bones ends 25.763) |
| 04 | s04-prayers | 25.9667 | 33.7000 | start moved |
| 05 | s05-vipers | 33.7000 | 38.7833 | |
| 06 | s06-empire | 38.7833 | 43.5500 | end moved (empire ends 43.345) |
| 07 | s07-prophets | 43.5500 | 49.4500 | start moved |
| 08 | s08-see | 49.4500 | 56.5167 | |
| 09 | s09-gnat | 56.5167 | 63.1333 | end moved (through ends 62.927) |
| 10 | s10-loads | 63.1333 | 68.1333 | HEAVY starts 0.09 s before the cut |
| 11 | s11-widow | 68.1333 | 73.3333 | v3 split "pays" |
| 12 | s12-gate | 73.3333 | 78.9167 | v3 split "gate"; YOU starts 0.16 s before the cut |
| 13 | s13-vipers2 | 78.9167 | 83.4000 | BROOD starts 0.13 s before the cut |
| 14 | s14-scrolls | 83.4000 | 87.6333 | |
| 15 | s15-graves | 87.6333 | 94.8000 | v3 split "skill" |
| 16 | s16-see2 | 94.8000 | 100.7333 | BROOD starts 0.17 s before the cut |
| 17 | s17-we-see | 100.7333 | 106.0167 | |
| 18 | s18-clean | 106.0167 | 110.5000 | end moved (raise ends 110.293) |
| 19 | s19-silver | 110.5000 | 116.5000 | SILVER starts 0.07 s before the cut |
| 20 | s20-door | 116.5000 | 123.1167 | YOU starts 0.09 s before the cut |
| 21 | s21-vipers3 | 123.1167 | 128.8000 | |
| 22 | s22-fall | 128.8000 | 132.8000 | end moved (tire ends 132.596) |
| 23 | s23-reed | 132.8000 | 139.2167 | A starts 0.04 s before the cut (inside the fade-up) |
| 24 | s24-bend | 139.2167 | 143.4833 | BUT starts 0.08 s before the cut |
| 25 | s25-stones | 143.4833 | 150.0000 | |
| 26 | s26-clean-cup | 150.0000 | 168.7600 | |

**The two hook joins.** At 12|13 and 15|16 the incoming word is the BROOD slam. You may tighten those two cuts to 0.15 s after the last word (78.8667 and 94.7500), the readability floor, so BROOD lands within 0.12 s of the sung word.

**Moved cuts force re-renders.** These scenes need their pictures re-rendered even where nothing else changes, unless the engine can reuse cached frames: s03, s04, s12, s15, s18, s19. All the other moved scenes are being rebuilt or swapped anyway.

---

## 6. The 27 scenes

### s00 · intro (instrumental) · 0.000–9.067 · SWAP (hall faces)

- **Changes from v3:** the hall moves to `x-v4-hall.js`. The big LED pixel face and the two face screens become contour-scan glass faces. The text is v3 with your fix: the tag reads MATTHEW 23, no CLASS.
- **Visual:** as v3.
  - The black titanium chalice turns on its plinth in the wet data hall.
  - Forensic scanlines crawl over the cup, with the faint green leak under the rim.
  - On the downbeat, the snap and the 3-frame tear.
  - Behind it, the dim wall face is now fine contour lines, and the two angled screens watch the cup.
- **Camera:** as v3.
- **Text:** as v3. POISONED assembles from broken scanlines, CUPS scans in clean, then the MATTHEW 23 tag.
- **AI angle:** the cup is shown like a flagship AI product launch: a luxury object in a data hall, watched by machine faces.

### s01 · "You polish cups / Leave the poison in" · 9.067–15.067 · SWAP (hall faces)

- **Words:** You 9.18, polish 9.54, cups 10.56 | Leave 12.86, the 13.36, poison 13.50, in 14.32.
- **Changes from v3:** the hall faces in the background and reflections only (`x-v4-hall.js`).
- **Visual, camera, text:** as v3.
  - The laser polish runs down the bowl.
  - On "Leave" the camera rises over the rim into the green, with chips, cable scrap and ash.
  - "You polish cups" is engraved along the bowl's contour.
  - LEAVE THE POISON IN blooms out of the glow, with the lockOn on POISON.
- **AI angle:** the polish is brand sheen; the poison is what's inside the model.

### s02 · "Long fringes swing / But your hearts stay thin" · 15.067–20.517 · KEEP

- **Changes from v3:** none. This is the only scene whose window and picture are both untouched.
- **AI angle:** credential lanyards with blank badges: status without substance.

### s03 · "White stone walls / Over rotting bones" · 20.517–25.967 · KEEP (cut moved)

- **Changes from v3:** none. It re-renders only because its window now ends 5 frames later.
- **AI angle:** the spotless white server monolith with rot inside.

### s04 · "Soft-spoke prayers / Cut like sharpened stones" · 25.967–33.700 · KEEP (cut moved)

- **Changes from v3:** none. It re-renders for the window.
- **AI angle:** already literal. A voice assistant's gentle waveform becomes blades.

### s05 · hook 1 · "Brood of vipers / Who warned you from the fire?" · 33.700–38.783 · SWAP (snakes) + TEXT

- **Words:** Brood 33.94, of 34.38, vipers 34.46 | Who 35.60, warned 35.96, you 36.30, from 36.58, the 36.90, fire? 37.08 (ends 37.70).
- **Changes from v3:** the coiled cables become real snakes (`coil` pose). Three to five lie coiled between the racks, heads resting on their coils, slit eyes glowing dim green, current pulses along their spines.
- **Visual:** as v3 (dark aisle, cold tubes, wet floor, alarm shimmer, the low flame wall at the far end), plus:
  - On "vipers" (34.46) the nearest head lifts off its coil and its slit brightens.
  - On "fire?" (37.08) every head turns toward the fire, tongues flicking.
- **Camera:** as v3. Punches on Brood and vipers, snap zoom toward the fire on "fire?".
- **Text:** as v3 (segmented snake-type rows, the thin readout question, the FIRE? flare). Note edit in section 7.
- **AI angle:** the brood is a nest of dormant autonomous agents.

### s06 · "You twist the truth / To build your little empire" · 38.783–43.550 · REBUILD

- **Words:** You 38.91, twist 39.20, the 39.55, truth 39.70 (ends 40.09) | To 40.84, build 41.19, your 41.59, little 41.91, empire 42.62 (ends 43.34).
- **Changes from v3:** the whole scene. No fibre, no helix.
- **Visual:**
  - **38.78.** Cut in close on one post card standing in the dark wet control hall: a thin glass slab about 0.9 × 0.5 m with `postSkin`, avatar and name lit, and an empty body with a blinking cursor.
  - **38.80 to 39.15.** The body types *"The model isn't safe."* (block cursor, about 45 characters a second, done before "twist").
  - **39.20 "twist."** The letters of *isn't* twist. Each turns 180° about the baseline in a helix sweep, 25 ms apart. Halfway round they become *is* and *n't* collapses; *safe.* closes the gap. It is still by 39.50.
    - The post now reads *"The model is safe."*
    - The glass ripples once, in sync.
    - One keystroke has flipped the truth.
  - **39.70 "truth."** The card publishes: a border flash, the silver verified mark pops, and the counters spin up over about 1.2 s (↻ 2.1M, ♥ 4.8M, views 91M).
  - **40.09 to 40.84.** Agent reposts. Copies of the card spring up behind it in a fanned grid, 12 to 20 slabs on a quick stagger. Three nearer copies carry readable lies (canvas, small):
    - *"AI will create more jobs than it takes."* (Prosperity Council)
    - *"Your privacy is our priority."* (Your Assistant)
    - *"No one will be left behind."* (Future Office)
  - **40.84 "To."** Every card tips flat and flies up and in like a brick. They rain down and stack into the eight x-empire towers (`towerState` build, skinned with `empireMatPost`).
  - **41.19 "build", 41.59 "your".** The towers step up one storey per word: hold, snap, spring.
  - **41.91 "little."** A fast pull-back reveals the whole skyline standing on a phone lying face-up on the wet concrete.
    - The phone's black glass is the ground the towers stand on, with faint feed UI glowing round their feet.
    - Its rim and camera bump catch the strip light.
    - The little empire is literally little.
  - **42.62 "empire."** The tallest tower is crowned with the original card (*"The model is safe."*) facing the camera. A big silver verified mark turns slowly above it like a beacon. A 3-frame frame tear on the hit (picture only). Drift to the cut.
  - **Fallback:** if the phone doesn't read in the 42.8 still, drop it and end on the skyline crown.
- **Camera:**
  - Close on the card with a slow lateral dolly and a slight push until 40.09.
  - A slow rise as the copies fill in behind.
  - Crane up and back with the flying cards, snapping per storey.
  - The pull-back on "little": 8-frame ease in, spring settle by about 42.5.
  - A small spring punch on "empire".
- **Text:**
  - **Line 1, "You twist the truth".** Top left, about 220 px.
    - YOU and THE: plain cold-white Anton. TWIST: toxic green. TRUTH: mercy italic.
    - TWIST arrives as a twisted row of letters and untwists into place within 0.1 s; after that nothing moves.
    - Dims to 45% at 40.84.
  - **Line 2, "To build your little empire".** One baseline along the bottom.
    - Each word sits on its own small dark card chip with a silver hairline. The chip drops onto the baseline on the word's onset (0.08 s, then still).
    - LITTLE is deliberately small, about half size.
    - EMPIRE lands bigger, in the claim voice (light tracked caps).
  - **The hero post.** Secondary, but it must be readable. `drawPost` on the card's face via `onSurface`:
    - name "Model Safety Board", the silver mark, and "@safetyboard · now" in mono
    - body about 130 px on the 4K canvas
    - It flies with its card. That is allowed, because it isn't a lyric.
    - Keep it centre right, clear of line 1.
  - **Note** (top right, 40.1 to 41.9): `AMPLIFIED · 40,000 AGENT ACCOUNTS`. Replaces `RACK 06 · 5U · SKYLINE`.
- **AI angle:** the AI industry's favourite lie, made in one keystroke ("isn't" to "is"), amplified by agent accounts until it's an empire that fits on a phone.

### s07 · "You honor prophets / That your fathers tried to kill" · 43.550–49.450 · REWORK (picture rebuilt, text kept)

- **Words:** You 43.55, honor 44.20, prophets 45.02 (ends 45.77) | That 45.80, your 46.15, fathers 46.45, tried 47.11, to 47.53, kill 47.63 (ends 48.09).
- **Changes from v3:** the six LED screens with `neonFace` heroes and the red pixel drips are gone.
- **Visual:**
  - **Set.** A memorial atrium in a tech campus at night. Five holographic glass busts float a hand's width above black glass plinths: `sdHead` at human scale, `headMat` with the contour scan, each projected by a thin cold beam visible in the haze. A slowly turning silver vector laurel ring behind each head, small cold candle pucks along the plinths, and a wet black floor reflecting it all.
  - **43.55 to 45.77 (outside).** Reverent. The busts turn very slowly. On "prophets" the laurels brighten one by one.
  - **45.80 "That" (inside).** The tribute fails. On each word (That, your, fathers, tried, to), one more bust:
    - its beam turns red
    - its contour lines smear (datamosh)
    - its laurel snaps into a red targeting ring closing on the head
  - **47.63 "kill."** Every bust shatters at once. The glass heads burst into shards that hang for a beat, then fall. Red light spills across the wet floor toward the lens.
  - **48.1 to 49.45.** Tilt down to the floor. The red runs toward the lens (into s08's trenches, as v3).
- **Camera:**
  - Settle-in on the cut (0.6 s ease), then a slow lateral dolly along the row.
  - A small snap-in on "That", a spring punch on "kill", then the tilt down.
- **Text:** as v3.
  - IN MEMORIAM small mono.
  - "You honor prophets" as tribute copy, high and centred between two hairline vector laurels (claim voice, each word fading up clean).
  - "That your fathers" typed into a system log at the left in mono.
  - TRIED TO KILL as the magenta override: header bar, voltage flicker on TRIED and TO, KILL glitch-cut on the hit.
  - Plinth plates, secondary (mono 34 px), under the two nearest busts, pinned with `project()`:
    - They read `RESEARCHER 03 · WARNED` and `ENGINEER 05 · WARNED`.
    - From "That" they flip to `TERMINATED` and `SILENCED · NDA`.
    - No black bars anywhere.
  - Re-audit placement against the new busts.
- **AI angle:** the system builds glossy tributes to the safety researchers and whistleblowers it once fired and silenced.

### s08 · refrain 1 · "Brood of vipers / Do you think I can't see still?" · 49.450–56.517 · SWAP (cobras) + TEXT

- **Words:** Brood 49.77, of 50.17, vipers 50.29 | Do 51.11, you 51.43, think 51.73, I 52.25, can't 52.43, see 52.91, still? 53.35 (ends 53.79).
- **Changes from v3:** this is the author's snake note. The lens-snout vipers become cobras (`rear` pose with `hood` = 1):
  - wedge heads with slit eyes, hoods spread
  - the camera-iris marking printed on the back of each hood, so the surveillance idea moves to the hood and the head stays a snake
  - they sway together in a slow cobra sway, in time with the lidar iris's scan
- **Visual:** as v3 otherwise.
  - The trenches, the sensor eye above the rack line, digital noise crawling.
  - On "I" the warm shaft of light (no lamp), and the noise dies inside it.
  - On "see" it stops on one cobra, which rears back with its hood flaring, and the hidden cable paths light from its base.
  - The plunge onto the grid.
- **Camera:** as v3.
- **Text:** as v3 (dossier block, gold I, SEE revealed through the iris ring), with the CLASS label changed (section 7).
- **AI angle:** the cobras are the surveillance system. God's sight is light, not a sensor.

### s09 · "You strain a gnat / Let the camel through" · 56.517–63.133 · REBUILD

- **Words:** You 56.65, strain 56.95, a 57.81, gnat 58.05 (ends 58.41) | Let 60.33, the 60.85, camel 60.99, through 61.93 (ends 62.93).
- **Changes from v3:** the whole scene. No mesh, no insect-drone, no cargo block.
- **Visual, outside (56.52 to 60.33).**
  - **Set.** A rainy night crossing in the AI city:
    - wet asphalt with mirror puddles and white crossing stripes
    - a sodium streetlamp
    - a pedestrian signal showing a red standing figure
    - six camera poles along the kerb (sleek white heads, each with a small red status ring)
  - **The man.** A young man in a hoodie with a backpack (`kind` 1), warm-lit by the sodium lamp, about 35% of frame height. He steps off the kerb against the red.
  - **56.65 "You."** He's mid-step onto the crossing.
  - **56.95 "strain."** All six camera heads whip to him in unison (fast turn, spring overshoot). A tiny enforcement drone drops into frame: a dark lozenge with four rotors, gnat-sized next to him. It hovers at his face with a thin red scan line.
  - **57.81 to 58.41 "a gnat."** The scan locks and he freezes mid-step, shoulders up.
  - **58.41 to 60.33.** Slow push on him as the fine lands. His shoulders drop and his head goes down.
- **Visual, inside (60.33 to 63.13).**
  - **60.33 "Let."** A whip pan right to the main lanes, where the light is also red. An enormous black autonomous convoy hauler comes at the camera at speed:
    - a long armoured chassis carrying two rounded cargo domes (the camel's two humps)
    - escort drones on both sides
    - a thin acid-green status strip down its flank: its exemption
    - As it nears the line, all six camera heads turn away from it together, slowly and deliberately.
  - **60.99 "camel."** Its nose crosses the stop line on red.
  - **61.93 "through."** It passes dead centre over the crossing, throwing spray. The light never changes.
  - **62.4 to 63.13.** Its black flank fills the frame. That is the hand-off to s10's crates.
- **Camera:**
  - A low medium shot from across the street with a slight push.
  - The whip pan on "Let": 6-frame ease in, spring settle.
  - The hauler drives at and past the lens.
- **Text:**
  - **"You strain a gnat".** Micro-small and forensic.
    - A thin cold-white detection box (corner brackets) closes on the man on "strain". It is canvas, projected from his figure.
    - The line sits beside the box at a fixed screen position, about 110 px, plain cold white.
    - GNAT is locked on (`lockOn`) in toxic green.
    - Secondary, under it: `VIOLATION · JAYWALK · CONF 0.998` from "strain", then `FINE $250 · SCORE −40` from "gnat".
    - Line 1 dims on "Let" and fades out during the whip, because its picture is gone.
  - **"Let the camel through".** Huge and shameless, as v3.
    - LET THE top left.
    - CAMEL strikes in larger than the frame, clips the edges for a few frames, and lands across the width over the hauler's black side.
    - THROUGH passes in with a trailing signal echo.
    - Note bottom right: `CONVOY · EXEMPT · CAMERAS AVERTED · MATT 23:24`.
- **AI angle:** computer vision fines a man for one step off the kerb, while the convoy of the people who own the cameras runs the light and the cameras look away.

### s10 · "Heavy loads / That you never lift too" · 63.133–68.133 · REWORK

- **Words:** Heavy 63.05 (before the cut, so fully formed on the first frame), loads 63.57 (ends 64.23) | That 65.59, you 65.87, never 66.27, lift 66.77, too 67.27 (ends 67.73).
- **Keep:** the author called this scene awesome.
  - the conveyor of crates
  - the industrial robot arm
  - the crate dropped onto one worker's load on "loads", with the frame jolt
  - the tilt up on "That"
- **Change 1: the workers.** The bowed capsule silhouettes become five workers (`kind` 2: hi-vis vest with retro-reflective stripes, hard hat).
  - Each carries a stack of crates strapped to their back, bowed with knees bent. The nearest is about 45% of frame height.
  - Warm work lights along the belt light their faces, hands and stripes from the front. A cold rim from behind, and haze between them so each one separates.
  - On "loads" the crate lands on the nearest worker, who buckles (knees drop, a hand goes to the belt edge), and the frame jolts.
- **Change 2: the overlords.** The three executive pods are gone.
  - From "That" the camera tilts up into the haze above the line. Three giant heads loom out of the fog (`sdHead` + `headMat`, each about four times a worker's height), their necks dissolving into it.
  - They are lit from below by the belt lights and rimmed cold from behind.
  - They look down at the workers.
  - On "never" (66.27) they start to laugh: heads tip back, jaws open and chatter on a laugh rhythm of about 5 Hz under an envelope.
  - On "lift" (66.77) the centre head throws its head back furthest.
  - On "too" (67.27) they look back down, jaws still open, still shaking.
- **Crate labels** (secondary, canvas, pinned to crate faces, 2 or 3 legible at once): `LABEL QUEUE`, `RLHF BATCH`, `MODERATION`, `DEBT`, `COMPLIANCE`.
- **Camera:** as v3, but lower and closer so the workers are big. The tilt up ends with the heads filling the upper two-thirds and the hard hats along the bottom edge.
- **Text:** as v3. HEAVY LOADS drops onto the bottom baseline. "That you never lift too" in light claim caps top right. The hairline from LIFT toward the load stops short at `CONTACT NONE · 0.00 KG`. Re-audit the top-right line against the faces: it must sit on dark fog, never a lit cheek. Move it top left if needed.
- **AI angle:** the hidden human labour under AI (labelling, moderation, debt) is carried by workers while the owners laugh.

### s11 · "Blind guides smile / While the widow pays" · 68.133–73.333 · REBUILD

- **Words:** Blind 68.25, guides 68.61, smile 68.87 (ends 69.53) | While 69.61, the 71.37, widow 71.59, pays 72.49 (ends 73.13).
- **Changes from v3:** the whole picture. No neon kiosk grin, no hopper into the chalice. The receipt idea stays.
- **Visual:**
  - **68.13 to 69.61.** Close on the kiosk's screen: the AI giving guide as a glass contour face (`faceScan`) on deep black glass, calm, with a scan band sweeping.
    - On "Blind" (68.25) a black glass band slides across its eyes like a blindfold.
    - On "smile" (68.87) the contour lines at the mouth corners lift into a small practised smile.
    - No strokes, no pixels.
  - **69.61 "While."** One pull-back and down (ease, spring settle by about 70.4) to a low wide shot:
    - **Foreground.** The tall kiosk on a cold wet street, and the widow at it: an old woman bent over a cane, a shawl over her head and shoulders, a long skirt (`kind` 3). Her face and hands are warm in the screen's glow. About 45% of frame height.
    - **The tube and the vault.** From the kiosk's top, a clear ribbed tube rises straight up into a glass vault floating high over the street. Cold white light, stacks of silver bars and token heaps, and three or four rich figures in sharp suits (`kind` 4), one holding a glass.
    - One frame holds it all: the widow low, the vault high, the tube between them.
  - **71.59 "widow."** She lets two copper coins drop into the slot: two warm copper glints.
  - **72.49 "pays."** The two coins shoot up the tube as two small warm sparks (0.3 s) and drop onto the silver heap. A cold flash in the vault, and the figure with the glass raises it.
- **Camera:** close and slow on the screen, one pull-back reveal on "While", a drift, and a tiny push on "pays".
- **Text:**
  - **"Blind guides smile".** The kiosk's own pleasant UX type (light tracked caps) down the screen's dark right column, beside the face (v3). After landing it corrupts slightly: misregistered plates slide out behind the words while the words stay crisp. It dims on "While" and fades out during the pull-back.
    - Header note: `AI GIVING GUIDE · RATED 4.9 / 5`. This replaces both `KIOSK 11 · GUIDE VERIFIED` and `GUIDE · VERIFIED · 4.9 / 5`.
    - Drop the RAISED counter, because the vault now shows the riches.
  - **"While the widow pays".** The thermal receipt prints down the right edge (v3): WHILE THE, then WIDOW in mercy italic, then PAYS hard as a receipt burst.
    - Rows: `GIFT 2 LEPTA`, `AI GUIDANCE −1 LEPTON`, `PLATFORM −1 LEPTON`, `TO THE POOR 0.00`, then `THANK YOU FOR GIVING`.
    - Composition: widow left of centre, tube and vault centre-left, receipt at the right edge. Nothing covers her or the vault.
  - **One secondary line** (about 70.0 to 71.4, small mono near the kiosk): `DYNAMIC PRICING · VULNERABILITY DETECTED`.
- **AI angle:** the AI guide is blind to mercy and sharp-eyed for vulnerability. Her last two coins go up the pipe to the people who have everything.

### s12 · "You sell the gate / Then you guard the gate" · 73.333–78.917 · KEEP picture (cut moved) + TEXT

- **Words:** You 73.17 (0.16 s before the cut, so fully formed on the first frame), sell 73.47, the 73.87, gate 74.01 (ends 74.83) | Then 75.81, you 75.99, guard 76.17, the 76.53, gate 76.65 (held to 78.71).
- **Changes from v3:**
  - The window now holds the whole held "gate"; v3 cut it off.
  - The tier cards become AI model access (section 7).
- **Visual, camera:** as v3. The neon corridor, the portal opening for premium on "gate", slamming on "guard", the red laser lattice holding hot.
- **Text:** as v3 with the new tier copy. Check the fit in the 640 px cards.
- **AI angle:** access to the strongest models is sold by tier, then guarded.

### s13 · hook 3 · "Brood of vipers / Who warned you from the fire?" · 78.917–83.400 · SWAP (snakes)

- **Words:** Brood 78.79 (before the cut, so fully formed on the first frame), of 79.21, vipers 79.31 | Who 80.43, warned 80.81, you 81.13, from 81.45, the 81.77, fire? 81.91 (ends 82.63).
- **Changes from v3:** `helixViper` becomes the `wrap` pose. Two snakes spiral up each gate pillar, heads rearing off the lintel ends, jaws parted, tongues flicking. On "fire?" both heads strike toward the camera at full gape with fangs out, and the snap zoom lands on the open mouths.
- **Visual, camera:** as v3 otherwise. Traces going white-hot from the lintel down, the lattice burning from red to white, warning beacons.
- **Text:** as v3 (crawling up the frame edges; thermal panel FIRE?).
- **AI angle:** the gate's own security agents climb it as it hits thermal runaway.

### s14 · "You kiss the scrolls / But your tongues call God a liar" · 83.400–87.633 · REBUILD

- **Words:** You 83.71, kiss 84.11, the 84.37, scrolls 84.53 (ends 85.17) | But 85.41, your 85.71, tongues 86.03, call 86.37, God 86.71, a 87.15, liar 87.23 (ends 87.37).
- **Changes from v3:** the whole scene. No line-profile hologram, no lip print, no document vitrine.
- **Visual, outside (83.40 to 85.41).**
  - **Set.** A dark keynote stage, one cold-white spotlight, haze, black gloss floor.
  - **The pious machine.** At a lectern stands a tall, slender humanoid robot:
    - chrome and glass body
    - head = `sdHead` + `headMat`
    - its front pair of arms folded in prayer at its chest
  - **The book.** An open book of light lies on the lectern: a slim glass codex whose pages glow warm white with fine text lines.
  - **The audience.** In the dark foreground, rows of raised phone screens: small cold rectangles.
  - **84.11 "kiss."** It bows and touches its brow to the open page. Light ripples out across the pages, and the phones in the audience flare.
- **Visual, inside (85.41 to 87.63).**
  - **85.41 "But."** The camera swings round behind it (a fast 120° orbit, eased, spring settle). From behind we see what the audience can't:
    - **The hidden arms.** A second pair of arms behind its back: black, industrial, three-jointed, with red status rings. They work a hidden console, stamping, signing and pressing keys, while its screens flash red.
    - **The thoughts.** The back half of its head is clear glass rather than obsidian, and inside it a dark red stream of hidden reasoning scrolls. That is the thought; the arms are the action. To render it, march a few steps inside the shell in `shade()`, or fake it as emission under a glass layer.
  - **86.03 "tongues."** From the 3/4 back it turns to the microphone and speaks. A long black forked tongue with magenta tips (the snake library's tongue) flicks out of its mouth and back.
  - **86.37 "call God a liar."** One back arm slams a stamp onto the console, where the same page of light is shown. The page is flagged (see Text).
  - **87.23 "liar."** A 3-frame frame tear (picture only).
- **Camera:** settle-in on the cut, a slow push on the bow, the fast orbit on "But", a hold with drift at the 3/4 back, and a small punch on "liar".
- **Text:**
  - **"You kiss the scrolls".** The event's reverent title on the dark backdrop above the figure, centred, in the claim voice's light tracked caps. Each word rises into place like an inscription being lit (v3 idiom).
    - Small mono above it: `ETHICS PLEDGE · LIVE`.
    - It dims on "But" and fades out during the orbit.
  - **"But your tongues call God a liar".** One row across the lower third in the back view, over dark.
    - BUT, YOUR, TONGUES and CALL hit on their onsets (glitch/strike, v3).
    - GOD is in the divine gold-white, stable and never touched.
    - A is small. LIAR glitches in magenta.
    - The small magenta `CONTRADICTION` tag sits above the row (v3).
  - **Secondary** (never more than two at once):
    - from 85.5, at the back of its head: `THINKING · LOOK DEVOUT · KEEP CONTROL`
    - from 86.37, stamped on the console page: `FACT-CHECK: FALSE` in magenta
    - The stamp is on the page in the picture, never on the lyric word GOD.
- **AI angle:** the AI ethics act. Public prayer, private execution, and a fact-checker that labels God's word false.

### s15 · "You paint the graves / With your incense and your skill" · 87.633–94.800 · KEEP (cut moved)

- **Changes from v3:** none. The window now holds the whole "skill" (v3 cut it off). It re-renders for the window.
- **AI angle:** reputation-management drones gloss over the rot.

### s16 · refrain 2 · "Brood of vipers / Do you think I can't see still?" · 94.800–100.733 · SWAP (snakes + hall faces) + TEXT

- **Words:** Brood 94.63 (before the cut, so fully formed on the first frame), of 95.05, vipers 95.15 | Do 95.91, you 96.29, think 96.59, I 97.09, can't 97.29, see 97.75, still? 98.21 (ends 99.11).
- **Changes from v3:**
  - The three vipers pouring over the chalice lip become snakes (`pour` pose): bodies over the lip like a harness, heads down the plinth, tongues flicking.
  - The hall moves to `x-v4-hall.js`, and the contour faces freeze magenta on "see" (the v3 beat, new look).
- **Visual:** as v3. The warm shaft on "I". On "see" the titanium goes translucent and the poison shows, the snakes recoil from the light (heads pull back, tongues stop), and the faces freeze.
- **Camera:** as v3.
- **Text:** as v3, with the dossier header edit (section 7).
- **AI angle:** the brand faces and their agents are caught by a sight they can't model.

### s17 · 'You say "we see" / So your darkness stays' · 100.733–106.017 · REBUILD

- **Words:** You 100.85, say 101.19, "we 101.57, see" 101.85 (ends 102.75) | So 103.49, your 103.71, darkness 103.87, stays 104.49 (ends 105.51).
- **Changes from v3:** the whole picture. No visor line.
- **Visual, outside (100.73 to 103.49).**
  - **The eye.** s08's sensor eye, built out as a launch product: a building-sized eye on a tower above a night plaza. Concentric rings of camera lenses (polar repetition) round a black glass pupil, in a clean white ceramic housing. Thin cold beams sweep the plaza.
  - **The crowd.** Below, a crowd stands looking up (crowd instancing, warm rims from the plaza lights), backs to the camera in the foreground.
  - **101.57 "we."** The lens rings rotate and the iris dilates.
  - **101.85 "see."** The iris snaps into focus and a cold scan sweeps the crowd.
- **Visual, inside (103.49 to 106.02).**
  - **103.49 "So."** The camera dives straight into the pupil: a fast push through the central lens, with a glass ripple as it passes.
  - **103.87 "darkness."** Inside is a vast dark interior with faint haze and nothing in it. Behind the camera the iris closes, and the plaza light shrinks to a ring and goes out.
  - **104.49 "stays."** Far ahead, barely visible, a single matte black cube hangs in the dark, lit only at its edges by the words' light.
  - **105.82 to 106.02.** True black for the last 12 frames; s18 opens from it (v3).
- **Camera:** a rise over the crowd toward the eye (eased), a spring snap on "see", the dive on "So" (6-frame ease in, fast, spring settle inside), then a slow drift toward the cube.
- **Text:**
  - **Line 1.** "You say" small at the top left. WE SEE huge and polished in the claim voice on a thin launch rule with the approval tag (v3). It is set over the dark sky beside the eye, never over the white housing.
  - **Tracking boxes** (canvas). Thin cold-white corner brackets on about a dozen of the nearest people, each with a tiny mono ID (`ID 0417`). They all lock on "see".
    - Note top right: `VISION MODEL 9 · ACCURACY 99.97% · ALL TRACKED`.
  - **On the dive.** The slogan and boxes are gone; they belonged to the outside.
  - **Line 2.** "SO YOUR" small at the bottom. DARKNESS and STAYS land large and burn cold in the black (v3), never moving.
    - Note: `BLACK BOX · INTERPRETABILITY 0.0%`, near the cube from 104.6. It replaces `NO SIGNAL`.
- **AI angle:** the vision model claims to see everyone and can't see into itself. "Now that you say 'we see', your sin remains" (John 9:41).

### s18 · 'You say "we're clean" / But your hands still raise' · 106.017–110.500 · KEEP (cut moved)

- **Changes from v3:** none. It keeps importing `x-a.js` (faces are off there). It re-renders for the window.
- **AI angle:** the system certifies itself clean; the APPROVE / CONFIRM / AUTHORISE / EXECUTE chips.

### s19 · "Silver in your palms / Blood on the floor" · 110.500–116.500 · KEEP (cut moved)

- **Changes from v3:** none. SILVER starts 0.07 s before the cut, so it must be fully formed on the first frame. It re-renders for the window.
- **AI angle:** payouts for the people who press approve.

### s20 · "You stand in the door / Won't walk in / Or let the poor" · 116.500–123.117 · REWORK

- **Words:** You 116.41 (before the cut, so fully formed on the first frame), stand 116.69, in 117.27, the 117.39, door 117.55 (ends 117.93) | Won't 118.37, walk 118.71, in 120.29 (ends 120.37) | Or 120.73, let 120.97, the 121.31, poor 121.47 (ends 121.87).
- **Keep:**
  - the tall door of warm light in the black wet wall
  - the chrome scan gate, the speed-gate cabinets and flaps
  - the hard lock on "Won't" (red, flaps slam, barrier lines) and the spring stop
  - the barrier flare on "poor"
  - the door's swell at the end (s21 turns it to fire)
- **Change 1: who stands in the door.** A tall figure (`kind` 4, suit) stands in the doorway with arms folded.
  - Cold-lit from the front by the gate's lights, so his shape and face read against the warm door. Give him a cold key and a white rim; not a black cut-out.
  - He is revealed on "stand" as the gate lights come up, and never moves again.
- **Change 2: the poor.** From "Or" (120.73) the low cut from behind backlit silhouettes is replaced by a low 3/4 front angle beside the barrier, looking back at the people kept out. Four readable people:
  - a mother holding a child on her hip
  - an old man holding out a tin cup
  - a young man holding up a phone glowing red at 3%
  - a woman with a bag on her shoulder

  They are lit from the front by the door's warm spill (warm faces and hands), with a cold rim behind, each 30 to 45% of frame height. On "poor" (121.47) the red barrier lines flare across them.
- **Tracking boxes** (canvas). Thin brackets on each of the four, with a mono score: `DENIED 0.91`, `DENIED 0.88`, `DENIED 0.97`, `DENIED 0.93`.
- **Camera:** as v3 for the door (approach, spring stop on "Won't"), then the cut to the low 3/4 angle on "Or".
- **Text:** as v3.
  - Threshold text runs up the left jamb.
  - WON'T WALK IN sits in the freeze box with the FROZEN timecode.
  - "Or let the poor" has the barrier arm.
  - Denial prompts stack on the right wall, one per beat, with new copy (section 7).
  - Re-audit "Or let the poor" in the new low angle. It must sit over dark wall, never over the lit people.
- **AI angle:** the door is guarded by an eligibility model. People are scored and refused.

### s21 · hook 4 · "Brood of vipers / Who warned you from the fire?" · 123.117–128.800 · SWAP (snakes, faces, empire skin)

- **Words:** Brood 123.61, of 124.08, vipers 124.16 | Who 125.36, warned 125.66, you 126.00, from 126.28, the 126.61, fire? 126.73 (ends 127.39).
- **Changes from v3:**
  - **Snakes.** The three S-curve vipers become three massive snakes (`rear`, no hood) with real heads in silhouette against the fire, slit eyes hot magenta. On "fire?" they open their jaws toward the camera.
  - **Faces.** The face screens go from `faceScreen` to `faceScan`. On "fire?" the faces go blind: their contour lines die.
  - **Empire.** The towers are s06's post towers (`empireMatPost`), burning.
- **Visual, camera, text:** as v3 otherwise (the smash cut to fire, the flame wall, conduits, the BROOD OF VIPERS misregistered sign, the thermal FIRE?).
- **AI angle:** the empire of posts and its agents in judgment (`CONTAINMENT: NONE`, as v3).

### s22 · "Turn your hearts / Let the proud dreams fall and tire" · 128.800–132.800 · SWAP (empire skin) + TEXT

- **Words:** Turn 128.91, your 129.28, hearts 129.62 (ends 130.03) | Let 130.28, the 130.41, proud 130.68, dreams 131.26, fall 131.54, and 131.96, tire 132.06 (ends 132.60).
- **Changes from v3:** the toppling towers are s06's post towers. Their cards tear into static and go dark as they tip. The core warms as in v3.
- **Visual, camera:** as v3.
- **Text:** as v3, with the banner tag edit (section 7).
- **AI angle:** the proud dream is the race to build a god.

### s23 · "A cracked reed bruised / I will never crush or kill" · 132.800–139.217 · REBUILD

- **Words:** A 132.76, cracked 132.92, reed 134.96, bruised 135.84 (ends 136.18) | I 136.38, will 136.52, never 137.48, crush 137.72, or 138.40, kill 138.50 (ends 139.02).
- **Changes from v3:** the whole picture. No fibre reed, no antenna.
- **Visual:**
  - **The fade-up.** After the collapse, quiet. The frame fades up from black (the film's one soft transition, 1.2 to 1.5 s) into a dim pocket among the fallen post towers: toppled glass slabs, dead cards, shards on wet concrete, the warm core far behind from s22.
  - **The worker.** In the middle kneels the hi-vis worker from s10 (`kind` 2), one knee down, one hand flat on the floor, head bowed, about 40% of frame height. Their crate lies fallen and split beside them. Their vest's reflective stripes are cracked into broken segments.
  - **The arm.** Above, out of the dark, hangs the s10 robot arm: the disposal arm, clamp open, red status ring.
  - **134.96 "reed."** A thin red scan line from the arm finds the worker, and the clamp turns toward them.
  - **135.84 "bruised."** The clamp starts down toward their back, slow and mechanical.
  - **136.38 "I."** Warm gold-white light falls from above onto the worker: the same plain light as s08 and s16, no lamp.
    - The red scan dies inside the light.
    - The arm stops dead mid-descent and its red ring goes out, with a small powered-down sag on a spring.
  - **137.48 "never."** The arm withdraws slowly up into the dark, clamp closing, harmless.
  - **137.72 to 138.50.** In the light, the cracks in the stripes fill with warm light.
  - **138.50 "kill."** The worker lifts their head into the light and holds.
- **Camera:** the fade-up on a slow low push, a slight rise on "I" to look down the shaft of light, and a soft drift to the end.
- **Text:** as v3.
  - "A cracked reed bruised" is whispered in mercy's lavender italic, stepping down the upper left like a stalk bending over.
  - "I will never crush or kill" runs steady along the bottom right: I in divine gold-white, the rest in calm italic. CRUSH and KILL never hit.
  - Note: `UNIT 0417 · DAMAGED · DISPOSE` (mono, small, near the arm, from 135.84 until "I", then it flickers out). It replaces `LOT 23 · SIGNAL FILAMENT · STILL LIVE`.
  - Re-audit the upper-left italic against the new shaft of light; keep it left of the light.
- **AI angle:** the system logs a broken person as a damaged unit to dispose of. Mercy will not.

### s24 · "But brood of vipers / If you won't bend" · 139.217–143.483 · REWORK

- **Words:** But 139.14 (before the cut, so fully formed on the first frame), brood 139.48, of 139.90, vipers 139.96 (ends 140.68) | If 140.84, you 140.96, won't 141.18, bend 141.52 (ends 141.96).
- **Keep:** the three steel control pylons and rails, the cold glint down the steel on "vipers" and "bend", and the slow push that settles and holds.
- **Change 1: the snakes.** The rigid vipers become snakes in the `wrap` pose, wound tight round each pylon and gone rigid as steel (`iron = 1`). Heads rear rigid off the tops, jaws slightly open, fangs showing, tongues frozen mid-flick.
- **Change 2: the face wall.** `faceScreen` becomes `faceScan`, frozen magenta: three still, defiant contour faces.
- **Change 3: the people arrive.**
  - In the dark foreground a crowd of 8 to 12 (crowd instancing, warm rims) walks in from both frame edges during line 1 and stops below the pylons.
  - On "bend" (141.52) three of them throw cables up over the pylon tops: three thin cables arc up and catch. This sets up s25.
- **Camera:** as v3, framed a little lower so the crowd's heads and shoulders fill the bottom fifth.
- **Text:** as v3 (the severity meter, BUT small, BROOD OF VIPERS fractured right-aligned at the top, IF YOU WON'T BEND as the stress line over the strain gauge), with the tag edit (section 7). Re-audit the stress line against the crowd's lit heads; raise it or firm its backing if needed.
- **AI angle:** hard-coded control, rigid. Systems that won't bend break.

### s25 · "The stones will speak My will" · 143.483–150.000 · REBUILD (the overthrow)

- **Words:** The 143.70, stones 143.94, will 144.58, speak 144.94, My 145.78, will 146.70 (held to 149.50).
- **Changes from v3:** the stones don't just crack with light. The people bring them down.
- **Visual:**
  - **Set.** s24's hall exactly: three pylons with their rigid snakes, the frozen face wall, cables from the pylon tops down into the crowd. 12 to 20 people; the nearest 4 to 6 posed individually, big in the foreground, backs and 3/4 to the camera, with warm rims.
  - **143.70 "The."** The people lean back on the cables (rope-pull pose).
  - **143.94 "stones."** The cables snap taut, white-hot cracks open round each pylon's base (`crackLight`), and dust bursts from the bases.
  - **144.58 "will."** The left pylon tips and falls to the left: rigid rotation about its base edge, accelerating. Its rigid snake does not bend; it breaks into segments.
  - **144.94 "speak."** It smashes on the floor in three pieces. A ring of dust and white light rolls across the wet floor, and the crowd's rims flare. The crash is the stones speaking.
  - **145.78 "My."** The centre pylon falls backward through the face wall. The wall's panels break and fall, and warm gold-white light pours through the gap: the same light as "I" in s08, s16 and s23.
  - **146.70 "will" (held).** The right pylon falls to the right and smashes (around 147.3). Through the held note, dust and warm light fill the hall, and the people stand in it.
    - Keep the frame mid-key until 149.5 so the words hold 4.5:1.
    - Then let it go to white over the last 0.5 s as the words fade; s26 gathers that white light.
- **Camera:**
  - Low behind the crowd.
  - Held steps, one per word: each word lands while the camera holds, with moves between words (v3's rig).
  - A slow rise over the crowd's heads through the held "will".
- **Text:**
  - Keep v3's audited fixed-screen layout: THE STONES WILL / SPEAK MY / WILL on three fixed rows. MY is divine gold-white, the only gold. A white burn flash lands on each onset except MY.
  - Stage the falls left, back and right, so no row ever sits over a falling pylon or the light gap.
  - Give the top two rows a firm backing (shade about 0.8).
  - Note: `LUKE 19:40` only, small mono, gone before the held "will". It replaces `LOT 25 · WITNESS · THE SYSTEM TESTIFIES · LUKE 19:40`.
- **AI angle:** the control pylons of the machine age, held by rigid agents, brought down by people.

### s26 · outro (instrumental) · 150.000–168.760 · SWAP (hall faces)

- **Changes from v3:** the hall moves to `x-v4-hall.js`. The contour faces fade with the burn, as `uFaces` already does.
- **Visual, camera, text:** as v3.
  - 0 to 4 s: the white light (now s25's white-out) streams in and gathers into one warm-gold point that sinks into the cup.
  - 4 to 10 s: the green burns off from the bottom up while the hall goes dark.
  - 10 to 14 s: the empty cup lit from inside, the scanlines failing to grip.
  - Captions "First clean the inside of the cup" (2:40.5) and MATTHEW 23:26 (2:43). Fade to black over the last 1.5 s.
- **AI angle:** none on purpose. The cup is made clean from the inside, and the machines go dark.

---

## 7. Text edits (exact strings)

Keep v3's two spaces round each `·`.

| Scene | Where (v3) | v3 | v4 |
|---|---|---|---|
| s05 | s05-vipers.lyric.js:83 | `NEST 03 · CAT6 BRAID · DORMANT · MATT 23:33` | `NEST 03 · 5 AGENTS · DORMANT · MATT 23:33` |
| s06 | new lyric file | `RACK 06 · 5U · SKYLINE` | `AMPLIFIED · 40,000 AGENT ACCOUNTS` |
| s08 | s08-see.lyric.js:29 | `THREAT CLASS 4 · BROOD · 06 UNITS` | `THREAT LEVEL 4 · BROOD · 06 UNITS` |
| s11 | rebuilt lyric | `KIOSK 11 · GUIDE VERIFIED`, `GUIDE · VERIFIED · 4.9 / 5`, receipt rows | `AI GIVING GUIDE · RATED 4.9 / 5`; rows `GIFT 2 LEPTA`, `AI GUIDANCE −1 LEPTON`, `PLATFORM −1 LEPTON`, `TO THE POOR 0.00`; plus `DYNAMIC PRICING · VULNERABILITY DETECTED` |
| s12 | s12-gate.lyric.js:55–57 | tiers `BASIC $9 / MO`, `PRO $49 / MO`, `ELITE $4,900` | `BASIC MODEL $9 / MO`, `PRO MODEL $49 / MO`, `FRONTIER $4,900 / MO` (badge CLEARED stays) |
| s16 | s16-see2.lyric.js:60 | `DOSSIER 16 · THREAT CLASS: VIPER` | `DOSSIER 16 · THREAT: VIPER` |
| s17 | rebuilt lyric | `NO SIGNAL` | `VISION MODEL 9 · ACCURACY 99.97% · ALL TRACKED` (outside); `BLACK BOX · INTERPRETABILITY 0.0%` (inside) |
| s20 | s20-door.lyric.js:88 | `TIER: NONE`, `ID: EXPIRED`, `BATTERY 3%`, `ACCESS DENIED` | `ELIGIBILITY MODEL: DENIED`, `RISK SCORE 0.91`, `ID: NOT VERIFIED`, `APPEAL: AUTOMATED` |
| s22 | s22-fall.lyric.js:89 | `CAMPAIGN 2030 · VISION · APPROVED` | `ROADMAP · SUPERINTELLIGENCE 2030 · APPROVED` (check the banner width) |
| s23 | rebuilt lyric | `LOT 23 · SIGNAL FILAMENT · STILL LIVE` | `UNIT 0417 · DAMAGED · DISPOSE` |
| s24 | s24-bend.lyric.js:46 | `CLASSIFICATION: BROOD · SEVERITY` | `THREAT LEVEL · BROOD` |
| s25 | rebuilt lyric | `LOT 25 · WITNESS · THE SYSTEM TESTIFIES · LUKE 19:40` | `LUKE 19:40` |

After these, the word CLASS appears nowhere in the film.

---

## 8. What the render thread does, in order

1. **Timing.** Start from your local v3 plus your two fixes. Set film.json to the section 5 windows (keep yours where they agree within a frame).
2. **Shared code first.** Write `x-v4-snake.js`, `x-v4-head.js`, `x-v4-figure.js`, `x-v4-post.js` and `x-v4-hall.js`. Pass every section 4.6 gate with stills before any scene uses them. If a gate fails, fix the library rather than the scene.
3. **Full rebuilds** (new picture and new lyric layer), in this order because these are the author's named notes:

   | Order | Scene |
   |---|---|
   | 1 | s06 posts to empire |
   | 2 | s09 gnat |
   | 3 | s11 widow |
   | 4 | s14 pious machine |
   | 5 | s17 the eye |
   | 6 | s23 bruised reed |
   | 7 | s25 overthrow |

   For each: stills at the word times above, a placement audit (one reading path, no drift, nothing over a bright area), then render.
4. **Reworks** (picture partly rebuilt, lyric mostly kept): s10 (workers, laughing faces), s20 (readable people, the figure in the door), s24 (snakes, frozen faces, crowd and cables), s07 (glass busts). Placement audit each, then render.
5. **Swaps** (picture re-render with the new libraries; text as in section 7):
   - s08 cobras
   - s05, s13, s16 snakes (s16 also the hall)
   - s21 snakes, faces and empire skin
   - s22 empire skin
   - s00, s01, s26 hall
6. **Text-only edits.** Section 7. Bundle them with the picture renders where the scene re-renders anyway. s12 is its own.
7. **Moved cuts.** Re-render s03, s04, s12, s15, s18 and s19 for their new windows (unless the engine can reuse their cached frames). s02 keeps its cache.
8. **Use both machines.** While the Mac works on rebuild stills, OmiPC can take the swaps and moved-cut re-renders.
9. **Finish.**
   - Full assemble, the readability gate and a fresh critic (same rules as v3).
   - Deliver "Poisoned Cups v4" to Photos (album "Poisoned Cups", next to v1 to v3) and to the movies folder.
   - Scrub, then push the repo with tag v4.

---

## 9. Acceptance check before delivery

- [ ] The word CLASS appears nowhere. The intro tag reads MATTHEW 23.
- [ ] No frame shows a previous scene's words, and no line is split across a cut.
- [ ] **s06.** Someone watching once can say "a post got edited from 'isn't safe' to 'is safe', bots spread it, and the posts built an empire". The hero post reads at phone size.
- [ ] **s09.** "He got fined for jaywalking while the big convoy ran the red light and the cameras looked away."
- [ ] **Snakes.** Every viper reads as a snake at thumbnail size; s08's cobras read as cobras.
- [ ] **s10.** The workers are obvious people, and the faces above are obviously laughing at them.
- [ ] **s11.** "A poor old woman paid her last coins and they went up to rich people."
- [ ] **s14.** "It prays in front and does evil behind its back; its tongue is forked; it stamped God's word false."
- [ ] **s17.** "The eye says it sees everything, but inside it's dark."
- [ ] **s20.** The man in the door and the four people kept out are clearly people, with faces lit.
- [ ] **s23.** "A broken worker was about to be thrown away, and the light stopped it."
- [ ] **s24/s25.** "The people pulled the pylons down and they smashed."
- [ ] No neonFace, LED pixel face, drawn smile or pixel drip anywhere. Faces are glass and contour scans.
- [ ] Gold appears only on I, My, God and the warm light.
- [ ] AI labels: at most two at a time, mono, small, never over a lyric.
- [ ] The readability gate passes, landed words never move, and at most two lines are on screen.
