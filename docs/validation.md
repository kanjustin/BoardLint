# Validation evidence

Initial session: September 9, 2026.

## Base structure follow-up

`make check` now passes all 10 tests on Python 3.14.4. Two service-boundary tests
verify that CLI and service reports agree without modifying the board or writing
extra files, and that schematic content gets actionable PCB-file guidance even
when renamed with a `.kicad_pcb` extension. `make demo` and `make demo-json` both
run successfully; the JSON output parses and contains the expected single finding.
The tests run locally; remote CI and editable package installation remain unverified.

## Automated

`python3 -m unittest discover -s tests -v`: eight tests passed on Python 3.14.4.
Includes normalized extraction, threshold boundary, arc width, invalid thresholds,
repeatable reports, malformed/unsupported input, quoted strings/nesting, and CLI
JSON/exit behavior. The synthetic fixture returns one 0.15 mm finding at 0.20 mm.

GitHub Actions is configured for Python 3.11 and 3.14. Remote CI has not run as part
of this session. Editable package installation has not been validated.

## Real files

Successfully parsed all 19 `.kicad_pcb` templates in the local KiCad installation:
`/Applications/KiCad/KiCad.app/Contents/SharedSupport/template`.
All use format `20241229`. Examples: Arduino Nano (6 components), Arduino Mega
(13), STM32H7 DevEBox (6), Raspberry Pi HAT (5).

These templates contain no routed tracks or vias. This is useful extraction smoke
coverage, not validation of trace findings on real routed designs. Counts above
are parser outputs and have not yet been independently cross-checked in KiCad.
Local application templates are not copied into the repository.

## Routed design and independent oracle

Downloaded the official [KiCad 9 StickHub example](https://github.com/KiCad/kicad-source-mirror/blob/9.0/demos/stickhub/StickHub.kicad_pcb)
to `/tmp/boardlint-real.kicad_pcb`, without adding the third-party design to this repo.
SHA-256: `eee1c88ee02d0101851c50e430fd98b18440ed828d633e6e3973a07cda1d34ce`.
The branch URL may change; the hash identifies the actual tested bytes.

BoardLint extracted 94 footprints, 1,293 routed segments/arcs, and 87 vias. At an
arbitrary 0.20 mm review threshold it produced 857 per-track findings. Using the
installed KiCad Python 3.9 runtime and native `pcbnew.LoadBoard` independently:

- Counts matched for footprints, routed tracks and vias.
- The complete set of below-threshold object UUIDs matched.
- All 857 measured widths, start coordinates, net names and layer names matched.

The native runtime emitted a wxApp initialization assertion message but returned
successfully; the explicit comparison assertions all passed. This verifies stored
data interpretation, not engineering usefulness or physical board performance.

The high finding count demonstrates a product issue to solve before a pilot:
global thresholds and per-segment warnings can overwhelm a report. Add grouping,
contextual configuration and reviewed exceptions before calling these findings
useful. They are not 857 demonstrated design errors.

## Known limits

- Only one file format version and one rule; not the MVP.
- No board-outline, pad, zone, courtyard or connectivity model.
- No component-to-edge calculation yet.
- Reader validates required extracted fields, not full KiCad file semantics.
- No real-board false-positive baseline or performance benchmark yet.
- No viewer, API, upload service, AI, revision comparison or deployed application.

Next verification is a pinned, redistributable routed corpus with repeatable native
cross-checks, followed by human review of usefulness and false positives.
