# Architecture and initial decisions

## Current dependency flow

```text
CLI -> services/review.py -> parsers/kicad.py -> normalized Board
                |
                +-> analysis.py -> rules/trace_width.py -> structured report
                                                              |
CLI <---------------------------------------------------------+
```

The early web workspace adds a browser adapter: file bytes -> module worker ->
Pyodide -> the same Python `review_file` service -> JSON -> React results. It uses
a static export and same-origin runtime assets, so no PCB upload server is needed.
The Python source snapshot is refreshed from the canonical package on local and
monorepo builds and tested for parity. See [web implementation](../web/README.md).

Rules accept normalized objects only. Future input adapters feed the same model;
the future HTTP layer calls the same review service as the CLI. The viewer consumes
normalized geometry and report locations. AI, if added, consumes evidence rather
than manufacturing its own measurements. No database or services are needed today.

## Decisions as of September 9, 2026

**Python 3.11+ core:** follows the description's suggested processing direction.
Use the standard library for this small first slice. Framework and geometry-library
choices remain open until corpus experiments justify them. FastAPI and a TypeScript
UI are candidates for later phases, not installed dependencies.

**Limited direct reader:** reads the s-expression tree with size/nesting bounds,
then extracts only fields needed by the initial model. It is not a full KiCad
validator. Unknown board versions fail clearly instead of implying compatibility.
Only format `20241229` is currently accepted, based on local KiCad 9 templates.
Before expanding the reader, compare maintained libraries and native KiCad tooling
for coverage, deployment cost, licensing and error handling.

**Coordinates:** board positions and widths remain in millimeters. Footprint
rotation is retained. Pads and footprint-local graphics are not transformed or
used for analysis yet. Segment/arc locations use the stored start point; the model
retains endpoints and arc midpoint for a future viewer.

**Stable source identity:** UUID/timestamp IDs are retained. Missing IDs receive
an explicitly positional fallback (`kind:index`), stable for identical input only.
Revision comparison must not rely on fallback IDs remaining stable after edits.
Duplicate modeled IDs and unknown track net references are rejected.

**Configuration:** the first rule requires a positive finite CLI threshold. There
is no universal default or inferred manufacturing profile. Configuration files,
net-specific thresholds and deliberate suppressions come after basic accuracy.

**Reports:** schema version, executed rule version and parameters, board counts,
coverage limitations and structured findings. Ordering is deterministic for the
same input/configuration. No timestamps or random IDs enter reports. Future reports
should add input hashes, per-rule coverage/skips, engine version and source provenance.

## Research sources

Checked September 9, 2026:

- [KiCad board format](https://dev-docs.kicad.org/en/file-formats/sexpr-pcb/):
  board header, net declarations, layer list, segment/via/arc fields.
- [KiCad shared s-expression format](https://dev-docs.kicad.org/en/file-formats/sexpr-intro/):
  millimeter units, containing-object coordinates, footprint position/rotation,
  UUIDs and common graphics.

The documentation describes a wider format than this implementation supports.
Do not mistake successful extraction of a subset for complete format compliance.

## Geometry and connectivity work still required

Outline primitives need topology validation and cutout handling. Component spacing
needs explicitly chosen extents (courtyard versus fabrication body versus pads).
Back-side and rotated footprints need independent transform checks. Zones and
layer-aware copper connectivity must precede path-based rules. Straight-line
distance must be labeled as such; it is not routed path length or electrical loop size.

## Hosting boundary, when needed

Keep the local engine independent of storage and accounts. A hosted adapter needs
bounded uploads, bounded worker runtime/memory, isolated parsing, safe filenames,
and tested deletion/retention behavior before handling user designs. The current
25 MiB and 128-level parser bounds alone are not a complete hosted security model.
Do not send designs or findings to an external AI provider implicitly.
