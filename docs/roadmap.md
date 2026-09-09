# Proposed 12–16 week roadmap

Start: September 9, 2026. Twelve weeks ends around December 2; sixteen around
December 30. Dates assume steady weekly availability, which is not yet known.
Advance on evidence, and reduce scope if accuracy work takes longer.

| Window | Deliverable | Exit evidence |
| --- | --- | --- |
| Weeks 1–2 | Parser/CLI foundation and one rule | Real routed board read; independently checked finding; malformed input handled; repeatable JSON; supported versions documented |
| Weeks 3–4 | Geometry foundation and component-to-edge rule | Rotation/back-side fixtures; closed outlines and cutouts; independently verified distances; unsupported shapes skip explicitly |
| Weeks 5–6 | Approximately five conservative rules | Trace width, edge clearance, via diameter, component courtyard spacing, via drill size or another justified geometric check; positive/negative/boundary tests for each |
| Weeks 7–8 | Local alpha and calibration | Review a proposed corpus of 10–20 varied boards with 3–5 designers; classify false positives; config file, suppression reasons, stable report schema; reassess scope |
| Weeks 9–10 | Thin HTTP adapter and upload/report flow | Same findings as CLI; bounded processing; clear failures; upload deletion behavior verified; no account requirement |
| Weeks 11–12 | Basic 2D viewer and first pilot | Pan/zoom, layer visibility, issue selection and accurate highlighting; useful end-to-end review on pilot boards |
| Weeks 13–14 | Reliability buffer and contextual rule experiment | Address pilot blockers; evaluate one relationship heuristic only with labeled evidence and explicit uncertainty |
| Weeks 15–16 | Release preparation; optional revision/CI spike | Document limits; reproducible release; demonstrate useful workflow; defer stretch work if foundational quality is inadequate |

AI explanations, full net inspection, hosted history and robust revision comparison
are stretch/later work. They are not dependencies of the useful first release.

## Current increment

- [x] Review and preserve the product intent in repository documentation.
- [x] Clone the existing GitHub repository into `dev/BoardLint`.
- [x] Isolate parser, model, rule and report composition.
- [x] Implement a configurable width check with traceable structured output.
- [x] Add local CLI, controlled failure behavior and automated tests.
- [x] Smoke-test actual installed KiCad templates (unrouted; see validation).
- [x] Validate findings on a real routed board against KiCad independently.
- [ ] Complete the geometric board model; current model is intentionally partial.

## Next development tasks, in order

1. Turn the successful StickHub/native-KiCad experiment into a repeatable corpus
   test with redistribution provenance and pinned input. Add smaller routed boards
   and independent expectations. Do not treat one board as broad compatibility.
2. Compare the limited adapter with existing parser libraries and KiCad tooling
   using the same corpus before expanding it substantially.
3. Model pads, courtyard geometry, outline primitives and source metadata. Preserve
   local geometry until coordinate transformations have independent tests.
4. Define edge-clearance semantics: use courtyard-to-outline distance as an explicit
   placement proxy; handle outside/intersecting geometry, internal cutouts, missing
   courtyards and deliberately edge-mounted connectors. Do not silently substitute
   footprint origins or axis-aligned bounding boxes.
5. Implement validated outline assembly and a narrow supported geometry subset;
   report reasons for skipped checks. Add rotated, mirrored, concave and arc fixtures
   before advertising broader geometry support.
6. Deliver the edge rule end to end. Then add the remaining small rules.

## Rule selection decisions

Width comes first because its evidence is explicitly stored in tracks and it needs
no assumptions about physical component extents. This changes the suggested order
in the brief while retaining its requirement for one reliable vertical feature.

Defer suspicious connectivity/indirect routing until a layer-aware connectivity
model handles pads, vias and zones. Raw segment-length sums are not connection-path
lengths. Proposed fifth rule is configurable via drill diameter, with fabrication
context supplied by the user. This is a review check, not a new engineering standard.

## Review cadence

Each week: demonstrate one concrete improvement on a board, review noisy findings,
update the corpus and limitations, and choose the next smallest testable increment.
At weeks 4, 8 and 12: reassess scope against actual evidence and available time.
