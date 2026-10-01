#!/bin/zsh
# After tools/clip-frames.py: point scenes/p<id>-*.js at its clip (frame count from art/video/<id>/).
cd "${0:A:h}/.."
for id in "$@"; do
  n=$(ls art/video/$id/f*.jpg | wc -l | tr -d ' ')
  f=$(ls scenes/$id-*.js | grep -v lyric)
  perl -pi -e "s/art: '$id'(, clip: \{ count: \d+ \})?/art: '$id', clip: { count: $n }/" $f
  echo "$f -> $n frames"
done
