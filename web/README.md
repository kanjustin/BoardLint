# BoardLint web

One-page PCB review workspace: drag/drop or choose a KiCad board, select the
minimum trace-width threshold, run analysis, inspect paginated findings, and
download the complete JSON report. The interface also provides an example board,
invalid-input guidance, progress, cancellation, and a 90-second job timeout.

## Development

```sh
npm ci
npm run dev
npm test
npx tsc --noEmit
npm run build
```

Node 24 and Python 3.11+ are used for development/testing. Python is needed for
the native CLI parity test, not for serving the deployed website. `npm run build`
exports static assets to `dist/client`.

## Same analyzer, local processing

`scripts/prepare-engine.mjs` snapshots the canonical `../boardlint` Python source
into `public/engine/boardlint.json` before development, testing, and builds. It also
copies the synthetic example and the pinned Pyodide runtime into public assets.
In a standalone website checkout, the committed source snapshot is used.

`public/review-worker.mjs` loads the runtime from this site's own origin. It invokes
the Python `review_file` service inside a worker using a temporary virtual file.
The file is removed after analysis, and the worker is terminated on completion,
cancellation, timeout, or error. Nothing persists between page sessions. Files and
reports are never POSTed to a server. Downloaded JSON is saved only at user request.

The browser and native CLI share the rule implementation; JavaScript does not
duplicate the PCB parser or engineering calculations. Pyodide guidance:
[usage](https://pyodide.org/en/stable/usage/index.html) and
[module workers](https://pyodide.org/en/stable/usage/webworker.html).

## Vercel configuration

Live website: https://boardlint.vercel.app. The production deployment succeeded
on September 9, 2026; its page and core analyzer assets passed HTTP checks.

Configure the existing `boardlint` Vercel project as:

| Setting | Value |
| --- | --- |
| Root directory | `web` |
| Framework | Other (`null`) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist/client` |

`vercel.json` commits the build/output settings. Root directory is a Vercel project
setting. The repository root is a Python CLI package, not a Python HTTP app;
deploying that directory with Vercel's Python preset fails with “No python
entrypoint found.” Do not add a fake Python entrypoint to work around this.

The `.openai/hosting.json` records an initially registered private Sites project.
It was not deployed: the owner subsequently selected their existing Vercel project
for the working website. The static build can support either host without altering
the analysis engine.

## Validation and limitations

Node tests execute the real Python WebAssembly runtime and compare its report with
the native CLI, check configuration/error cases and input limits, verify temporary
file cleanup, and check source-snapshot parity. TypeScript and the production build
are separate checks. Browser interaction QA was not requested; no connected browser
was available for the preview handoff.

An optional feature-detected WebMCP surface exposes `review_selected_board` and
`get_review_summary` through the same UI actions. No supported WebMCP validation
context was available, so this integration has not been runtime-verified.

Only trace-width review for KiCad 9 format `20241229` is supported. Pagination
retains all findings but does not yet group related segments. There is no board
renderer, automatic fix, server storage, account system, or revision comparison.
