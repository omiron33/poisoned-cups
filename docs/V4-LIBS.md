# v4 shared libraries: APIs (from their builders' reports)

## lib/x-v4-post.js (post cards)
- Include order: STUDIO_GLSL + EMPIRE_GLSL (lib/x-empire.js) + POST_GLSL, then the scene's mapObj/material/shade. Uniforms ...POST_UNIFORMS: uPostSpan (slabs per card 1–4, default 3; 1 = one strip post per slab), uPostLit (default 1), uPostBurn (0..1 for s21: cards char from the bottom).
- GLSL: vec3 postSkin(vec2 uv, float seed, float lit) (1.8:1 card; negative seed = hero mode: border and glass only, canvas card on top; lit 0 dead, 1 lit, >1 publish flash, 0.05–0.6 tears into static); vec3 postSkinA(uv, aspect, seed, lit) (aspect > 4: one-row strip post); float postCardSDF(vec3 q, vec2 hs) (thin glass card facing +z); Mat postCardMat(q, n, hs, seed, lit); Mat empireMatPost(int id, vec3 p, vec3 n) replaces empireMat/dashSlabMat (cards on all tower sides, tear to static and go dark as the tower tilts; id 30 fibre = silver glass; fibre draws only if a scene sets uFibHi).
- JS (lyric modules): ACCOUNTS.safety / .prosperity / .assistant / .future; drawPost(ctx, x, y, w, post, t, opts) -> { h, typed, cursor, twistK, published }. post = { account, time, body, typeAt, cps (45), twist: { word: "isn't", to: 'is', at }, publishAt, counters: [['reply','38K'],['repost','2.1M'],['like','4.8M'],['views','91M']] }. opts: px (default w*0.066; use ~w*0.085 for the hero), alpha, bg, cursor, h. Also postHeight(ctx, w, post, opts), drawMark(ctx, cx, cy, r, alpha, scale).
- Hero post on a GLSL card: mpp = 2*hs.x/W, h = W*hs.y/hs.x; onSurface (lib/x-f.js) with origin [c.x-hs.x, c.y+hs.y, c.z+0.0125], axes [1,0,0],[0,1,0], drawing drawPost(ctx, 0, 0, W, HERO, t, { h, px: W*0.085 }); GLSL side postCardMat(..., -1.0, lit). Export the camera from the picture module (as s14 does). Example: scenes/t-post.js + t-post.lyric.js.

## lib/x-v4-figure.js (people)
- import { FIGURE_GLSL, POSES, pose, mixPose, walk, POSE_IDS } from '/song/lib/x-v4-figure.js'. Include order STUDIO_GLSL + FIGURE_GLSL + your code. No uniforms of its own.
- Frame: person at origin facing +z, feet y=0, ~1.75 tall; side +1 = person's left (+x). Scale: sdPerson3(q/s, ...)*s.
- Pose: A=(bend, lean, headPitch(+down/−up), shrug 0..1); B=(armL pitch, armL elbow, armR pitch, armR elbow) pitch 0 hang, 1.57 forward, 3.1 up; elbow 0..2.6; C=(stride −1..1, crouch, kneel (right knee), fold).
- GLSL: float sdPerson3(q, A, B, C, kind); sdPerson(q, A, B, kind) (C=0). kind: 0 plain, 1 hoodie+backpack, 2 hi-vis vest+hard hat, 3 widow (shawl, long skirt), 4 suit, 5 child (0.55 scale). Sets global gPart.
- Mat personMat(q, n, v, A, B, C, kind, seed) (v = direction to camera in same frame as n). Warm skin patches with slight emission; lime vest with silver stripes flaring toward camera.
- void personPose(int id, out A, out B, out C) with P_STAND, P_STRIDE, P_FROZEN, P_LOAD, P_BUCKLE, P_WIDOW, P_TOAST, P_LOOKUP, P_FOLD, P_MOTHER, P_CHILD, P_OFFER, P_PHONE, P_KNEEL, P_KNEELUP, P_WALK, P_THROW, P_PULL.
- Joint helpers: personHand(A,B,C,kind,side), personHead, personPelvis, personHip(…,side) (child seat; see t-figure.js childAt()), personBack.
- Props: sdCane(q, hand), sdLoad(q, back, A, n), sdGlass(q, hand), sdCup(q, hand), sdPhone(q, hand), sdRope(q, a, b, r).
- Crowd: float sdCrowd(p, cell, n, A, B, C, jit, out vec3 info); Mat crowdMat(p, n, v, cell, ncell, A, B, C, jit). Grid of n columns×rows centred on origin; e.g. cell (0.95, 1.1), n (5, 4).
- JS: POSES[name] -> {A,B,C} arrays for uniforms; mixPose(a, b, k); walk(phase, k).
- Lighting: keep a warm key on faces/hands (test used uKeyDir [0.45, 0.65, 0.75]); dark fabric on a dark cyc with a weak key turns to silhouette. Crowd head pitch reads better from a lower/closer camera. Example: scenes/t-figure.js.

## lib/x-v4-head.js (glass machine face) and lib/x-v4-hall.js (hall without pixel faces)
- HEAD_GLSL after STUDIO_GLSL (include-guarded). float sdHead(vec3 q, float jaw, float tilt): facing +z, chin y=0, crown y=1, neck to y=−0.45; scale sdHead(q/s, jaw, tilt)*s. jaw 0..1 = laugh (crescent mouth, raised cheeks, squint); tilt + = head back.
- Mat headMatT(q, n, live, jaw, tilt) (use when jaw/tilt ≠ 0) / headMat(q, n, live): black obsidian glass with ~30 cold-white depth iso-lines and a sweeping band; live=0 freezes magenta ("caught").
- vec3 faceScan(vec2 uv −1..1, yaw ±0.6, mouth, smile, live, vec3 ink): 2D contour-scan face for screens (emission only; multiply by screen brightness).
- JS laughPose(t, t0, t1, {rate=5, back=0.28, open=0.55}) -> {jaw, tilt, shake} for laughing (s10). Shoot laughing heads front-on or slightly below (3/4 laugh reads weakly).
- x-v4-hall.js: same exports/ids/uniforms as x-a.js (HALL_GLSL, HALL_UNIFORMS; uFaces, uFreeze, uHallGlow); already includes HEAD_GLSL; swap the import path only (s00, s01, s16, s26). CYBER_GLSL only needed for glitchTear. Examples: scenes/t-head.js, t-hall.js.

## lib/x-v4-snake.js (snakes)
- Include STUDIO_GLSL + [CYBER/VIPER/XB if wanted] + SNAKE_GLSL + scene code. Names prefixed sk/gSk/snake. Ground under belly at y=0 in the snake frame; yaw turns +x to (cos yaw, 0, sin yaw); R full body radius, L length (m).
- sdSnake(q, L, R, amp, k, ph, lift, lp, gape, hood) (tail x=0, head x=L facing +x); snakeAt(p, base, yaw, L, R, amp, k, ph, lift, lp, gape, hood); snakeCoil(p, base, yaw, R, turns, ph); snakeRear(p, base, yaw, L, R, h, ph, gape, hood) (hood=1 cobra); snakeStrike(p, base, yaw, L, R, k, ph) (0 cocked .. 1 lunge, gape follows); snakeWrap(p, base, Rp, R, H, y0, y1, a0, neck, gape, hood) (replaces helixViper); snakePour(p, edge, yaw, L, R, hEdge, flow, gape).
- keepSnake() when a snake wins the min in mapObj; Mat snakeMat(p, n, iron) (iron=1 rigid steel, pulses off). Globals: gSkFlick (−1 flicks; 0..1 freezes), gSkEye (default acid green; vec3(3.4,0.25,1.6) magenta for s21), gSkPulse, gSkIris (hood iris markings; lower if they read as eyes).
- Example: scenes/t-snake.js (poses every 1.25 s). Gate sheet out/v4lib/snake-gate.jpg.
