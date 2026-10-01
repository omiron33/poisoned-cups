// Premium relief: a still image lifted into 3D by its depth map (tools/depth.py), so a camera can
// push in and drift across it with real parallax. Pair with lib/p-code.js to draw it in code.
//
//   import { relief } from '/song/lib/p-relief.js';
//   const r = await relief(THREE, { image: '/song/art/p09.png', depth: '/song/art/p09.depth.png' });
//   inner.add(r.mesh);
//
// The image fills a plane `width` wide at z = 0 (height from the image's aspect), centred on the
// origin; near pixels come forward by up to `relief` (world units, default 0.35 * width). Where depth
// jumps (a silhouette against the background) the stretched skin fades out, so moves stay clean.
// `framing(fov, aspect)` gives the camera distance at which the plane exactly fills the frame.
// Options: segments (default 640 across), relief, width, light: { dir, amount } to re-light the
// surface from its own depth normals (0 = the image's own light only), gain (image brightness).

const load = (THREE, url) => new Promise((res, rej) => new THREE.TextureLoader().load(url, res, undefined, rej));

// A moving relief: o.frames = { dir, count, fps } reads <dir>/f0001.jpg and <dir>/d0001.png (its depth)
// and onward; call `await r.seek(seconds)` before each frame to show the frame at that clip time.
export async function relief(THREE, o) {
  const F = o.frames;
  const name = (k, i) => `${F.dir}/${k}${String(i).padStart(4, '0')}.${k === 'f' ? 'jpg' : 'png'}`;
  if (F) { o = { ...o, image: name('f', 1), depth: name('d', 1) }; }
  const [img, dep] = await Promise.all([load(THREE, o.image), load(THREE, o.depth)]);
  img.colorSpace = THREE.SRGBColorSpace;
  for (const t of [img, dep]) { t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; }
  // auto exposure: bring the picture's mean level to about `level` (default 0.2) unless gain is given
  if (o.gain == null) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 36;
    const x = cv.getContext('2d'); x.drawImage(img.image, 0, 0, 64, 36);
    const d = x.getImageData(0, 0, 64, 36).data; let m = 0;
    for (let i = 0; i < d.length; i += 4) { const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; m += Math.pow(l, 2.2); }
    m /= d.length / 4;
    o = { ...o, gain: Math.min(3.2, Math.max(0.7, (o.level ?? 0.36) / Math.max(m, 1e-3) * 0.35)) };
  }
  const aspect = img.image.width / img.image.height;
  const width = o.width ?? 1, height = width / aspect;
  const sx = o.segments ?? 640, sy = Math.round(sx / aspect);
  const geo = new THREE.PlaneGeometry(width, height, sx, sy);
  const L = o.light ?? {};
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: true,
    uniforms: {
      img: { value: img }, dep: { value: dep }, relief: { value: o.relief ?? 0.35 * width },
      texel: { value: new THREE.Vector2(1 / dep.image.width, 1 / dep.image.height) },
      size: { value: new THREE.Vector2(width, height) },
      lightDir: { value: new THREE.Vector3(...(L.dir ?? [0.6, 0.5, 0.6])).normalize() }, lightAmt: { value: L.amount ?? 0 },
      gain: { value: o.gain ?? 1 }, tear: { value: o.tear ?? 0.06 },
    },
    vertexShader: /* glsl */ `
      uniform sampler2D dep; uniform float relief, tear; uniform vec2 texel, size;
      varying vec2 vUv; varying float vStretch; varying vec3 vN;
      float D(vec2 uv) { return texture2D(dep, uv).r; }
      void main() {
        vUv = uv;
        float d = D(uv);
        // how much the depth jumps around this vertex: a tear between foreground and background
        float dx = D(uv + vec2(texel.x * 2.0, 0.0)) - D(uv - vec2(texel.x * 2.0, 0.0));
        float dy = D(uv + vec2(0.0, texel.y * 2.0)) - D(uv - vec2(0.0, texel.y * 2.0));
        vStretch = length(vec2(dx, dy));
        vN = normalize(vec3(-dx * relief / (4.0 * texel.x * size.x), -dy * relief / (4.0 * texel.y * size.y), 1.0));
        vec3 p = position + vec3(0.0, 0.0, d * relief);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D img; uniform vec3 lightDir; uniform float lightAmt, gain, tear;
      varying vec2 vUv; varying float vStretch; varying vec3 vN;
      void main() {
        vec3 c = texture2D(img, vUv).rgb * gain;
        float lit = mix(1.0, 0.35 + 1.1 * max(dot(normalize(vN), lightDir), 0.0), lightAmt);
        float a = 1.0 - smoothstep(tear * 0.6, tear, vStretch);
        if (a < 0.02) discard;
        gl_FragColor = vec4(c * lit, a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  let shown = 1;
  const seek = async (sec) => {
    if (!F) return;
    const i = Math.max(1, Math.min(F.count, 1 + Math.floor(sec * F.fps)));
    if (i === shown) return;
    const [a, b] = await Promise.all([load(THREE, name('f', i)), load(THREE, name('d', i))]);
    a.colorSpace = THREE.SRGBColorSpace;
    for (const t of [a, b]) { t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; }
    mat.uniforms.img.value.dispose(); mat.uniforms.dep.value.dispose();
    mat.uniforms.img.value = a; mat.uniforms.dep.value = b; shown = i;
  };
  return {
    mesh, width, height, aspect, uniforms: mat.uniforms, seek,
    // camera distance that makes the plane fill a frame of this vertical fov (degrees) and aspect
    framing(fov, frameAspect) {
      const t = Math.tan((fov * Math.PI) / 360);
      return Math.max(height / (2 * t), width / (2 * t * frameAspect));
    },
  };
}
