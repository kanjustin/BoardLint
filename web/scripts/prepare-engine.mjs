import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.resolve(root, '../boardlint');
const bundlePath = path.join(root, 'public/engine/boardlint.json');
await mkdir(path.dirname(bundlePath), {recursive:true});
try {
  await readdir(source);
  const files = {};
  async function collect(dir) {
    for (const entry of await readdir(dir, {withFileTypes:true})) {
      if (entry.name === '__pycache__') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await collect(full);
      else if (entry.name.endsWith('.py')) files['boardlint/' + path.relative(source, full).split(path.sep).join('/')] = await readFile(full, 'utf8');
    }
  }
  await collect(source);
  await writeFile(bundlePath, JSON.stringify(files, null, 2) + '\n');
  await copyFile(path.resolve(root,'../tests/fixtures/trace_width.kicad_pcb'), path.join(root,'public/example.kicad_pcb'));
} catch(error) {
  if(error.code !== 'ENOENT') throw error;
  // Standalone Sites checkout uses the source snapshot committed with this build.
  await readFile(bundlePath);
  await readFile(path.join(root,'public/example.kicad_pcb'));
}
await mkdir(path.join(root,'public/runtime'),{recursive:true});
for(const name of ['pyodide.mjs','pyodide.asm.mjs','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json']) {
  await copyFile(path.join(root,'node_modules/pyodide',name),path.join(root,'public/runtime',name));
}
console.log('Prepared Python engine and local runtime assets.');
