# BoardLint session handoff

Updated: September 9, 2026.

## Start here

Repository: `/Users/kan.justin/dev/BoardLint`
GitHub: https://github.com/kanjustin/BoardLint
Branch: `feat/web-review`
Open PR: https://github.com/kanjustin/BoardLint/pull/2 (base `main`; not merged)
Live production website: https://boardlint.vercel.app

Read `AGENTS.md`, `README.md`, `docs/product-brief.md`, `docs/roadmap.md`, and
`docs/validation.md` before implementation. The owner's original project brief
is `/Users/kan.justin/Downloads/BoardLint Project Description.pdf`; its intent is
captured in the repository documents.

## What this session completed

- Recovered the interrupted initial website work after the computer slept.
- Verified the browser review implementation and committed it as `5dbe5ad`
  (`feat(web): add local PCB review workspace`), pushed to `feat/web-review`.
- Opened PR #2. Python 3.11/3.14 jobs, web CI, and Vercel preview checks passed.
- Fixed the existing Vercel project: it incorrectly detected the Python CLI as
  a Python web application and failed with "No python entrypoint found."
- Configured Vercel root directory `web`, framework Other (`null`), install
  `npm ci`, build `npm run build`, output `dist/client`, Node 24.
- Deployed production successfully through the Vercel CLI. Deployment
  `dpl_GWDAdJRpurDFmepTm3ctUDNPrqwu` reached READY. The application code matches
  `5dbe5ad`; documentation was updated after deployment.

Production is live even though PR #2 is still open. Do not assume `main` contains
the website. Check current remote state before choosing a new branch or deploying.
Vercel's production Git branch is `main`.

## Working product and architecture

The user can select/drop one `.kicad_pcb` file (up to 25 MiB), choose a minimum
trace width, run analysis, inspect paginated findings and their evidence, and
download JSON. There is a synthetic example board, error guidance, cancellation,
and a 90-second timeout.

There is **no hosted backend, database, or AI model**. The existing Python parser
and deterministic trace-width rule run locally in a browser worker through
Pyodide. Board bytes are not uploaded. Runtime assets come from the same website.
The file is actually parsed and measured; results are not mock data.

- Python core: `boardlint/parsers/`, `models.py`, `rules/`, `services/review.py`.
- UI: `web/app/page.tsx`, `web/app/globals.css`, `web/lib/review.ts`.
- Worker: `web/public/review-worker.mjs`.
- Runtime bridge: `web/public/engine/review-runtime.mjs`.
- Build preparation: `web/scripts/prepare-engine.mjs` refreshes the committed
  Python source snapshot from `../boardlint` and copies pinned runtime assets.
- Frontend: React/Vinext static export; pinned dependencies in `web/package-lock.json`.

Only KiCad 9 board format `20241229` and one trace-width check are supported.
The model extracts footprints' metadata, tracks/arcs, vias, layers, and nets.
It does not yet model pads, outlines, courtyards, zones, or connectivity.
There is no PCB renderer, schematic parser, AI review, or hosted review history.

## Latest user discussion and likely next increment

The owner said the website looks good and asked whether a backend/model actually
reviews files and whether findings can be highlighted on a PCB or schematic.
Explained the local deterministic engine and proposed a **2D PCB viewer with
clickable trace highlighting** as the next visible feature. This was a proposal;
the owner then requested pushing the work and creating this handoff, not starting
the viewer in this session.

A viewer could render tracks/vias/components, support pan/zoom and layer toggles,
and highlight/zoom to the object selected in the findings list. Findings already
contain source object IDs, layer names, and locations. The browser report does
not yet provide a complete rendering model: expose validated geometry through a
separate model boundary rather than attempting to draw the board from findings.
Preserve the same coordinate system for geometry and highlights; test arcs and
layer handling with independent expectations.

Schematic highlighting is separate future work: `.kicad_sch` parsing and
PCB-to-schematic symbol/net linking are not implemented. Physical trace-width
findings belong on the PCB layout, not on schematic wires.

The existing roadmap prioritizes a reproducible routed-board corpus and validated
geometry. Reconcile a viewer increment with those accuracy gates; do not silently
claim that a viewer completes the five-rule MVP or edge-clearance analysis.

## Verification and remaining limits

Passed this session:

```sh
python3 -m unittest discover -s tests -v
python3 -m boardlint tests/fixtures/trace_width.kicad_pcb --min-trace-width 0.2
cd web
npm test
npx tsc --noEmit
npm run build
```

10 Python tests and four actual Pyodide runtime tests passed. Runtime tests cover
native CLI parity, threshold/error cases, size limits, cleanup, and source parity.
Production page, worker, Python bundle, and WASM returned HTTP 200 with expected
content types. GitHub Python/web checks and Vercel preview checks also passed.

Browser interaction/visual QA and the optional feature-detected WebMCP tools have
not been verified. HTTP checks and Node runtime tests do not establish full browser
interaction correctness. See `docs/validation.md` for real-board evidence and
limitations; no broad compatibility or engineering usefulness claim is justified.

## Operational notes

- `npm run build` needs a temporary localhost server for static prerendering.
  It failed with sandbox `listen EPERM`; rerunning with approved escalation passed.
- Vercel checkout link is in ignored `.vercel/`. Linking also generated ignored
  `.env.local`; do not print or commit credentials.
- `web/.openai/hosting.json` retains an initially registered private Sites project.
  The user selected their existing Vercel hosting; no Sites deployment was made.
  Applicable Sites skills must still be loaded for this configured project.
- Dependencies are installed. Generated runtime binaries, build output, and
  `node_modules` are ignored. Do not commit them or proprietary PCB files.
- About 3.8 GiB of disk space was available at session start. Avoid unnecessary
  duplicate installs and check capacity before large operations.
- No persistent development server was started in this resumed session. Use
  `cd web && npm run dev` when a local preview is needed.
- This handoff is a documentation-only follow-up commit on the same PR branch.
  No merge or new feature implementation was performed for the handoff request.
