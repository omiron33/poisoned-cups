# Contributing to Poisoned Cups

Pull requests are welcome: bug fixes, documentation, tests, new scene ideas and tooling.

Every pull request needs an approving review from Shane Fisher (@omiron33), the code owner, before it can be merged. `main` is protected, so please work on a branch or a fork and open a pull request against `main`.

## Run it

This repository holds the song's scenes and data: `scenes/` (one picture module and one lyric module per scene), `lib/` (the shared studio, flame and type voices), `data/` (aligned lyrics and measured beats) and `film.json` (scene order).

Read [docs/AUTHORING.md](docs/AUTHORING.md) before writing a scene. It covers the scene module format, the lighting and readability rules, and the test-still commands. `node tools/params.mjs <scene> --times` prints a scene's window and lines. Stills are drawn with the Ark engine's photoreal GPU scene renderer (https://github.com/omiron33/ark-video-studio), from its `photoreal` folder, as AUTHORING.md shows.

The visual plan is in [docs/BRIEF.md](docs/BRIEF.md) and [docs/STORYBOARD.md](docs/STORYBOARD.md). Source recordings and renders are never committed.

## Before you open a pull request

- Keep pull requests small and focused, and explain what you changed and how you checked it.
- For visual changes, render a still or a short clip and attach it to the pull request.
- Do not commit secrets, `.env` files, cookies, song recordings, full renders, or model weights. Large media stays out of git.
- Issues: use the bug report or feature request template.

## License

By contributing, you agree that your contributions are licensed under the repository's [MIT License](LICENSE). Fonts and third-party files keep their own notices.
