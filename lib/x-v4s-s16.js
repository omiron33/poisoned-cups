// s16 helper (v4): snakePour from lib/x-v4-snake.js (include SNAKE_GLSL first) with a serpentine
// drop. Below the lip the body swings side to side as it hangs (a travelling S, so the drop reads as
// a snake rather than a straight cable), and on the floor it slithers out with its head raised a little.
//   float snakePourS(p, edge, yaw, L, R, hEdge, flow, gape, wig)   wig 0..1 scales the swing
export const S16_GLSL = /* glsl */ `
float snakePourS(vec3 p, vec3 edge, float yaw, float L, float R, float hEdge, float flow, float gape, float wig) {
  vec3 q = skLocal(p, edge, yaw);
  float x0 = flow - L - R * 4.0, x1 = max(flow, 0.0) + R * 6.0;
  float hb = sdBox(q - vec3((x0 + x1) * 0.5, hEdge * 0.5 + R, 0.0), vec3((x1 - x0) * 0.5, hEdge * 0.5 + R * 3.0, R * 3.0 + 3.5 * R * wig) + vec3(1.5 * R * wig, 0.0, 0.0));
  if (hb > max(R * 2.0, 0.3)) return hb;
  float A = 3.14159265 * R;
  float Vd = max(hEdge - 2.0 * R - 2.0 * R, 0.0);
  for (int i = 0; i < 10; i++) {
    float sg = flow - L + L * float(i) / 9.0;
    vec3 P = skPourAt(sg, hEdge, R);
    // the hang: a travelling side-to-side S, pinned at the lip, growing down the drop
    float hang = smoothstep(A, A + 0.35, sg);
    float ws = sg * 6.2831853 / 1.3 - uTime * 2.4;
    P.z += wig * 3.0 * R * sin(ws) * hang;
    P.x += wig * 2.6 * R * (0.5 + 0.5 * sin(ws + 1.2)) * hang;   // out from the face only (never into the plinth)
    // on the floor: lift the head a little off the ground
    float onFloor = smoothstep(A + Vd + 0.1, A + Vd + 0.45, sg);
    P.y += R * 1.4 * onFloor * float(i) / 9.0 * float(i) / 9.0;
    gSkP[i] = P;
  }
  for (int i = 0; i < 10; i++) {
    vec3 T = normalize(gSkP[min(i + 1, 9)] - gSkP[max(i - 1, 0)]);
    gSkU[i] = normalize(cross(T, vec3(0, 0, -1)) + vec3(0.0, 1e-4, 0.0));
  }
  return skChain(q, 10, 0.0, 1.0, 0.0, L, R, gape, 0.0, 0.0, L + flow) * 0.85;
}
`;
