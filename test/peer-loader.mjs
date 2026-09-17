/**
 * Node loader: remaps the bare 'peerjs' import to an in-memory fake.
 * The fake is served as a data: URL so Vite-SSR treats it as external
 * (native ESM import) and host + guest share one module instance.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./fake-peer.mjs', import.meta.url));
const fake = 'data:text/javascript;base64,' + src.toString('base64');

export async function resolve(specifier, context, next){
  if(specifier === 'peerjs'){
    return { url: fake, shortCircuit: true };
  }
  return next(specifier, context);
}
