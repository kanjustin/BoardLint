'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, Check, Cpu, FileText, ShieldCheck, Upload, X, LoaderCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateFile, type Report } from '@/lib/review';

type ToolContext = {registerTool:(tool:{name:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};
const PAGE_SIZE = 10;
export default function Home() {
  const input = useRef<HTMLInputElement>(null);
  const active = useRef<{worker:Worker;timer:ReturnType<typeof setTimeout>;reject:(error:Error)=>void}|null>(null);
  const busyRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState('0.2');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report|null>(null);
  const [reviewedName, setReviewedName] = useState('');
  const [selected, setSelected] = useState(0);
  const [page, setPage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const latest = useRef<{run:()=>Promise<Report>;report:Report|null}>({run:async()=>{throw new Error('Not ready')},report:null});
  function stopWorker() { if(active.current){clearTimeout(active.current.timer);active.current.worker.terminate();active.current=null;} }
  useEffect(()=>()=>{active.current?.worker.terminate();if(active.current)clearTimeout(active.current.timer)},[]);
  function choose(files: FileList | File[]) {
    if(busyRef.current) return;
    setDragging(false);setError('');
    if(files.length !== 1){setError('Choose one PCB layout at a time.');return;}
    const next = files[0]; const problem = validateFile(next);
    if(problem){setError(problem);return;}
    setFile(next);setReport(null);setReviewedName('');setSelected(0);setPage(0);
  }
  async function example() {
    setLoadingExample(true);setError('');
    try {const response=await fetch('/example.kicad_pcb');if(!response.ok)throw new Error();const blob=await response.blob();choose([new File([blob],'example.kicad_pcb')]);}
    catch {setError('The example could not load. Please try again.');}
    finally {setLoadingExample(false);}
  }
  async function runReview():Promise<Report> {
    if(busyRef.current) throw new Error('A review is already running.');
    if(!file)throw new Error('Choose a PCB layout first.');
    const minimum=Number(threshold);
    if(!threshold.trim() || !Number.isFinite(minimum) || minimum<=0)throw new Error('Enter a trace width greater than zero.');
    busyRef.current=true;setBusy(true);setError('');setReport(null);setProgress('Reading the selected file…');
    try {
      const currentFile=file;
      const result=await new Promise<Report>((resolve,reject)=>{
        const worker=new Worker('/review-worker.mjs',{type:'module'});
        const fail=(message:string)=>{stopWorker();reject(new Error(message));};
        const timer=setTimeout(()=>fail('Review timed out after 90 seconds. Try a smaller board or retry.'),90_000);
        active.current={worker,timer,reject};
        worker.onmessage=({data})=>{
          if(data.type==='progress')setProgress(data.message);
          else if(data.type==='error')fail(data.message);
          else if(data.type==='result'){stopWorker();resolve(data.report);}
        };
        worker.onerror=()=>fail('The review engine stopped unexpectedly. Retry in a current browser.');
        currentFile.arrayBuffer().then(buffer=>{
          if(active.current?.worker===worker)worker.postMessage({buffer,threshold:minimum},[buffer]);
        }).catch(()=>fail('The selected file could not be read. Choose it again.'));
      });
      setReport(result);setReviewedName(currentFile.name);setSelected(0);setPage(0);setProgress('Review complete');
      return result;
    } catch(e) {const message=e instanceof Error?e.message:'Review failed. Please try again.';setError(message);throw e;}
    finally {stopWorker();busyRef.current=false;setBusy(false);}
  }
  function cancel() {
    const job=active.current;
    if(job){stopWorker();job.reject(new Error('Review canceled. Your file remains selected.'));}
  }
  function download() {
    if(!report)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=reviewedName.replace(/\.kicad_pcb$/i,'')+'-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  latest.current={run:runReview,report};
  useEffect(()=>{
    const context=(document as Document & {modelContext?:ToolContext}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const tools=[
      {name:'review_selected_board',description:'Run the selected local PCB file with the visible width setting and show its report. A file must already be selected.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async(input:unknown)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');const result=await latest.current.run();return {status:result.status,board:result.board,findings:result.findings.length};}},
      {name:'get_review_summary',description:'Read the completed review summary and analysis coverage.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:(input:unknown)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');const r=latest.current.report;return r?{status:r.status,board:r.board,findings:r.findings.length,limitations:r.limitations}:{status:'no_completed_review'};}}
    ];
    for(const tool of tools){try {Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser API. */}}
    return ()=>lifecycle.abort();
  },[]);
  const current=report?.findings[selected];
  const hasFindings=!!report?.findings.length;
  return <main className="workspace">
    <header className="topbar"><a className="brand" href="/"><Cpu size={25} aria-hidden/>BoardLint<span>LAB</span></a><span className="private"><ShieldCheck size={16} aria-hidden/> On-device review</span></header>
    <section className="heading"><div className="eyebrow">PCB DESIGN REVIEW / 001</div><h1>A second look at your board.</h1><p>Measured findings. Clear explanations. Your design stays yours.</p></section>
    <div className="workgrid"><section className="panel intake"><div className="section-label"><span>01 / INPUT</span><span>.kicad_pcb</span></div><h2>Start a review</h2>
      <div className={'dropzone'+(dragging?' dragging':'')+(file?' has-file':'')} onDragOver={e=>{e.preventDefault();if(!busy)setDragging(true)}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragging(false)}} onDrop={e=>{e.preventDefault();choose(e.dataTransfer.files)}}>
        {file?<FileText size={32} aria-hidden/>:<Upload size={32} aria-hidden/>}<h3>{file?.name || 'Drop your PCB file here'}</h3><p>{file?`${(file.size/1024).toFixed(1)} KB · Ready to review`:'KiCad 9 board layout · up to 25 MiB'}</p>
        <input ref={input} aria-label="Choose a KiCad PCB layout" type="file" accept=".kicad_pcb" className="sr-only" disabled={busy||loadingExample} onChange={e=>{if(e.target.files?.length)choose(e.target.files);e.target.value=''}}/>
        <Button variant="outline" className="choose" disabled={busy||loadingExample} onClick={()=>input.current?.click()}>{file?'Change file':'Choose a file'}<ArrowRight size={16}/></Button>
      </div>
      <div className="example-row"><span>No board handy?</span><Button variant="link" disabled={busy||loadingExample} onClick={example}>{loadingExample?'Loading…':'Try the example board'}<ArrowRight size={14}/></Button></div>
      <form onSubmit={e=>{e.preventDefault();void runReview().catch(e=>setError(e.message))}}>
        <div className="setting"><label htmlFor="width">Minimum trace width</label><div className="width-input"><Input id="width" type="number" min="0.000001" step="any" inputMode="decimal" required value={threshold} disabled={busy} onChange={e=>{setThreshold(e.target.value);setReport(null)}} aria-describedby="width-help"/><span>mm</span></div></div>
        <p id="width-help" className="setting-help">Your review threshold, not a universal manufacturing limit.</p>
        <Button type="submit" className="analyze" disabled={!file||busy||loadingExample}>{busy?<><LoaderCircle className="spin"/>Reviewing board…</>:<>Review board<ArrowRight/></>}</Button>
      </form>
      {busy&&<div className="progress-line"><span role="status">{progress}</span><Button variant="ghost" onClick={cancel} aria-label="Cancel review"><X size={16}/></Button></div>}
      {error&&<div className="error" role="alert"><AlertTriangle size={18}/><p>{error}</p></div>}
      <div className="privacy-note"><ShieldCheck size={19} aria-hidden/><p>Your file stays in this browser.<br/><span>Engine files load from this site. Your board is never sent.</span></p></div>
      <details className="file-help"><summary>Have a schematic instead?</summary><p>Open the PCB Editor in KiCad, update the board from your schematic, then place and route your components. Save and select the .kicad_pcb layout. Schematic files and images aren’t reviewed yet.</p></details>
    </section>
    <section className="panel results" aria-label="Review results" aria-busy={busy}><div className="section-label"><span>02 / REVIEW</span><span className="status-dot">{busy?'Analyzing':report?'Complete':'Awaiting board'}</span></div>
      {!report?<><div className="empty-review"><div className="empty-icon">{busy?<LoaderCircle className="spin" size={30}/>:<FileText size={30}/>}</div><h2>{busy?'A closer look, in progress.':'Evidence, before advice.'}</h2><p>{busy?'The first review loads a local Python runtime. This can take a moment. You can cancel at any time.':'Your findings will appear here, with the measured value, affected object, and a clear explanation of what to review.'}</p><div className="empty-steps"><span><Check/>Exact measurements</span><span><Check/>Source locations</span><span><Check/>Readable explanations</span></div></div><div className="coverage"><span className="eyebrow">CURRENT ANALYSIS</span><p>Trace width review</p><span>One deterministic check. More checks are in development.</span></div></>:
      <div className="report"><div className="report-heading"><div><h2>{hasFindings?'Review recommended':report.board.tracks?'No below-threshold traces':'No routed tracks to assess'}</h2><p>{reviewedName}</p></div><Button variant="outline" onClick={download} aria-label="Download JSON report" title="Download JSON report"><ArrowDownToLine/></Button></div>
      <dl className="board-stats"><div><dt>Components</dt><dd>{report.board.components}</dd></div><div><dt>Tracks</dt><dd>{report.board.tracks}</dd></div><div><dt>Vias</dt><dd>{report.board.vias}</dd></div></dl>
      <div className="findings-label"><strong>{report.findings.length} {report.findings.length===1?'finding':'findings'}</strong><span>Threshold: {report.rules_executed[0].parameters.minimum_mm} mm</span></div>
      {hasFindings?<><div className="finding-list" aria-label="Findings">{report.findings.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).map((f,i)=><button key={f.id} className={'finding-row'+(selected===page*PAGE_SIZE+i?' selected':'')} aria-pressed={selected===page*PAGE_SIZE+i} onClick={()=>setSelected(page*PAGE_SIZE+i)}><AlertTriangle size={17}/><span><strong>{f.net_name||'Unassigned net'}</strong><small>{f.layer} · {f.object_kind}</small></span><b>{f.measured_value} mm</b><ArrowRight size={15}/></button>)}</div>
      {report.findings.length>PAGE_SIZE&&<div className="pagination"><span>{page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,report.findings.length)} of {report.findings.length}</span><div><Button variant="ghost" aria-label="Previous findings" disabled={page===0} onClick={()=>{setPage(page-1);setSelected((page-1)*PAGE_SIZE)}}><ChevronLeft/></Button><Button variant="ghost" aria-label="Next findings" disabled={(page+1)*PAGE_SIZE>=report.findings.length} onClick={()=>{setPage(page+1);setSelected((page+1)*PAGE_SIZE)}}><ChevronRight/></Button></div></div>}
      {current&&<article className="finding-detail"><div className="detail-kicker">WARNING <span>Measured · high confidence in comparison</span></div><h3>{current.title}</h3><p>{current.message}</p><dl className="location"><div><dt>Position</dt><dd>X {current.location.x} · Y {current.location.y} mm</dd></div><div><dt>Object</dt><dd>{current.object_id}</dd></div></dl><h4>Why review this?</h4><p>{current.why_it_matters}</p><h4>What to consider</h4><p>{current.suggested_action}</p></article>}</>:
      <div className="clean-note"><Check size={20}/><p>{report.board.tracks?'No track widths fell below your configured threshold. Other aspects of the design have not been assessed.':'This file contains no routed tracks. Review again after routing your board in KiCad.'}</p></div>}
      <details className="report-coverage"><summary>Analysis coverage and limitations</summary><ul>{report.limitations.map(text=><li key={text}>{text}</li>)}</ul><p>Use the reported coordinates and object references in KiCad. Visual highlighting is not available in this version.</p></details>
      </div>}
    </section></div>
    <footer><span>Built for thoughtful hardware review.</span><span>Supports engineering judgment. Does not certify a board.</span></footer>
  </main>
}
