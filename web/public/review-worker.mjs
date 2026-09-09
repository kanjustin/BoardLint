import { installEngine, reviewBytes } from './engine/review-runtime.mjs';
self.onmessage = async ({data}) => {
  try {
    self.postMessage({type:'progress', message:'Preparing the local review engine…'});
    const {loadPyodide} = await import('./runtime/pyodide.mjs');
    const pyodide = await loadPyodide({indexURL: new URL('./runtime/',self.location.href).href, stdout:()=>{}, stderr:()=>{}});
    const response = await fetch('./engine/boardlint.json');
    if(!response.ok) throw new Error('Unable to load the review engine. Refresh and try again.');
    await installEngine(pyodide, await response.json());
    self.postMessage({type:'progress', message:'Reading your board and checking trace widths…'});
    const result = await reviewBytes(pyodide, new Uint8Array(data.buffer), data.threshold);
    self.postMessage(result.ok ? {type:'result',report:result.report} : {type:'error',message:result.error});
  } catch {
    self.postMessage({type:'error',message:'The local review engine could not start. Check your connection, then retry in a current browser.'});
  }
};
