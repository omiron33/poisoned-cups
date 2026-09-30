# Poisoned Cups

Scenes for a lyric film of *Poisoned Cups*, drawn entirely in code: no generated or photographic
images. Every frame is a raymarched GPU shader (titanium and gold, wet concrete, fibre-optic cable,
fire, haze) with the lyric set as its own layer, rendered at 1920×1080 and 60 fps.

The song is Matthew 23 for the machine age: Jesus' woes to the scribes and Pharisees, with today's
technocrats as the brood of vipers. The film's grammar is outside and inside (23:25–27): every
object is first shot polished, like a product launch, then the camera looks inside at what the
polish hides. It ends with the inside of the cup made clean.

The renderer is a separate lyric film engine (not public); it averages jittered sub-frames per
frame for motion blur and anti-aliasing and adds one shared film finish. This repository holds only
what belongs to this song:

- `scenes/`: one picture module and one lyric module per scene (`film.json` lists them in order).
- `lib/`: the shared studio (floor, backdrop, light, haze, grime), flame, and the recurring things:
  the chalice, the white gloves, the cable-vipers, the server-tower empire; plus the type voices
  and the word "weapons" (strike, slash, glitch, lock-on, redact).
- `data/lyrics.json`: every word with its sung start and end, force-aligned to the recording, plus
  measured beats.
- `docs/`: the director brief, the storyboard (reviewed by an independent critic) and the
  authoring guide.
- `tools/`: beat analysis, timing, and the scene plan that builds `film.json`.
- `fonts/`: Anton, Pirata One, UnifrakturCook, Permanent Marker (Apache 2.0) and JetBrains Mono,
  with their licences.

Words are set by meaning: the speaker (God, I, My) in gold blackletter; fire, vipers and poison in
Pirata One; the polished surface in tracked capitals; greed in red Anton; mercy in Garamond italic;
their own claims ("we see", "we're clean") hand-written.
