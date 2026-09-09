import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { loadPyodide } from 'pyodide';
import { installEngine, reviewBytes } from '../public/engine/review-runtime.mjs';
const runtime=await loadPyodide({stdout:()=>{},stderr:()=>{}});
const sources=JSON.parse(await readFile(new URL('../public/engine/boardlint.json',import.meta.url),'utf8'));
await installEngine(runtime,sources);
const fixture=new Uint8Array(await readFile(new URL('../public/example.kicad_pcb',import.meta.url)));
test('Python WebAssembly report matches native CLI exactly',async()=>{
  const result=await reviewBytes(runtime,fixture,0.2);
  assert.equal(result.ok,true);
  const native=JSON.parse(execFileSync('python3',['-m','boardlint','tests/fixtures/trace_width.kicad_pcb','--min-trace-width','0.2','--format','json'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}));
  assert.deepEqual(result.report,native);
  assert.equal(runtime.FS.analyzePath('/tmp/input.kicad_pcb').exists,false);
});
test('threshold changes, no-track board, unsupported version and renamed schematic',async()=>{
  assert.equal((await reviewBytes(runtime,fixture,0.1)).report.findings.length,0);
  const encode=s=>new TextEncoder().encode(s);
  const schematic=await reviewBytes(runtime,encode('(kicad_sch (version 20250114))'),0.2);
  assert.equal(schematic.ok,false);assert.match(schematic.error,/schematic/);
  const bad=await reviewBytes(runtime,encode('(kicad_pcb (version 20990101))'),0.2);
  assert.equal(bad.ok,false);assert.match(bad.error,/Unsupported/);
  const empty=await reviewBytes(runtime,encode('(kicad_pcb (version 20241229) (layers (0 "F.Cu" signal)))'),0.2);
  assert.equal(empty.report.board.tracks,0);
  assert.equal(runtime.FS.analyzePath('/tmp/input.kicad_pcb').exists,false);
});
test('input limits and malformed data fail without retaining the board',async()=>{
  await assert.rejects(reviewBytes(runtime,new Uint8Array(),0.2),/empty/);
  await assert.rejects(reviewBytes(runtime,new Uint8Array(25*1024*1024+1),0.2),/limit/);
  await assert.rejects(reviewBytes(runtime,fixture,NaN),/greater than zero/);
  assert.equal((await reviewBytes(runtime,new TextEncoder().encode('(invalid'),0.2)).ok,false);
  assert.equal(runtime.FS.analyzePath('/tmp/input.kicad_pcb').exists,false);
});
test('committed engine snapshot matches the canonical Python sources',async()=>{
  for(const [name,source] of Object.entries(sources)) assert.equal(await readFile(new URL('../../'+name,import.meta.url),'utf8'),source,name);
});
