// Shared by the browser worker and the Node-based runtime parity test.
export async function installEngine(pyodide, files) {
  for (const [name, source] of Object.entries(files)) {
    if (!/^boardlint\/[a-z_\/]+\.py$/.test(name) || name.includes('..')) throw new Error('Invalid engine bundle');
    const destination = '/home/pyodide/' + name;
    pyodide.FS.mkdirTree(destination.slice(0,destination.lastIndexOf('/')));
    pyodide.FS.writeFile(destination, source);
  }
  await pyodide.runPythonAsync(`
import json
from pathlib import Path
from boardlint.services import review_file
from boardlint.parsers.kicad import ParseError

def _boardlint_review(threshold):
    try:
        return json.dumps({"ok": True, "report": review_file(Path('/tmp/input.kicad_pcb'), minimum_trace_width_mm=threshold)}, allow_nan=False)
    except (ParseError, ValueError, UnicodeError) as error:
        return json.dumps({"ok": False, "error": str(error)})
`);
}
export async function reviewBytes(pyodide, bytes, threshold) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error('The selected file is empty. Choose a saved PCB layout.');
  if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('This file exceeds the 25 MiB limit.');
  if (!Number.isFinite(threshold) || threshold <= 0) throw new Error('Enter a trace width greater than zero.');
  pyodide.FS.writeFile('/tmp/input.kicad_pcb', bytes);
  pyodide.globals.set('_boardlint_threshold', threshold);
  try {
    return JSON.parse(await pyodide.runPythonAsync('_boardlint_review(_boardlint_threshold)'));
  } finally {
    pyodide.FS.unlink('/tmp/input.kicad_pcb');
    pyodide.globals.delete('_boardlint_threshold');
  }
}
