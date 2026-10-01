#!/bin/zsh
# Generate scene stills through the ChatGPT app's Codex (built-in image generation).
#   tools/gen-art.sh p10 p11 ...   reads art/prompts/<id>.txt, writes art/<id>.png
cd "${0:A:h}/../art"
CODEX=$(ls /Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex /Applications/ChatGPT.app/Contents/Resources/codex 2>/dev/null | head -1)   # the ChatGPT app's bundled Codex (moves between app versions)
for id in "$@"; do
  [ -f "$id.png" ] && { echo "$id exists"; continue; }
  prompt=$(cat "prompts/$id.txt")
  timeout 600 $CODEX -c 'openai_base_url="https://chatgpt.com/backend-api/codex"' -c 'model_reasoning_effort="low"' -m gpt-5.5 \
    exec --skip-git-repo-check -C "$PWD" \
    "Use your built-in image generation tool to create exactly one image, then copy the generated file into this folder as $id.png. Do not write code to draw it. $prompt Reply with the saved path only." < /dev/null > "${TMPDIR:-/tmp}/codex-$id.log" 2>&1
  [ -f "$id.png" ] && echo "$id ok" || echo "$id FAILED"
  rm -f ._*
done
