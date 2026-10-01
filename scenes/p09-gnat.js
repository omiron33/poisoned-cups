// p09 · "You strain a gnat / Let the camel through" (premium): the hooded kid caught by the gnat
// drone's red scan, from art/p09.png drawn in code (lib/p-scene.js).
import { codeScene } from '/song/lib/p-scene.js';
export const kind = 'three';
export default (P) => codeScene(P, { name: 'p09-gnat', art: 'p09', clip: { count: 175 } });
