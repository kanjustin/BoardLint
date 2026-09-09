# BoardLint

**Automated, explainable design review for KiCad PCBs.**

BoardLint helps designers investigate a practical question: *my board passes its
configured checks, but which design decisions still deserve review?*

It reads structured board data, measures properties, applies explicit rules, and
reports the evidence behind each finding. The goal is to combine repeatable
analysis with clear explanations, visual navigation, and eventually revision-aware
review workflows.

**Development status:** experimental local CLI with one working rule. The base
structure and planning documents are in place; the five-rule MVP and web viewer
are still in development.

## What works today

- Read KiCad 9 `.kicad_pcb` files using board format `20241229`.
- Extract component metadata, segments/arcs, vias, layers, and net declarations.
- Check trace widths against an explicitly supplied review threshold.
- Produce text or JSON findings with object IDs, nets, layers, coordinates,
  measurements, explanations, and suggested review actions.
- Run through a CLI or reusable Python review service, entirely locally.
- Return actionable errors for unsupported input, including schematic files.

The current model does not include pads, board outlines, zones, component extents,
or electrical connectivity analysis. Component-to-edge checks, other rules,
grouping, suppressions, file upload, and visual highlighting are planned.

## Which file should I use?

BoardLint initially reviews the **PCB layout (`.kicad_pcb`)**. A schematic
(`.kicad_sch`) describes the circuit but does not provide the board placement and
routing geometry needed by these checks. Images, schematic PDFs, Gerbers, and
project ZIP files are not supported initial inputs.

The review flow is:

1. Create the circuit and PCB layout in KiCad.
2. Save the `.kicad_pcb` file in a supported format.
3. Run BoardLint with your review threshold.
4. Inspect the findings and their locations in KiCad.
5. Make any appropriate changes, save, and review again.

See the [user workflow](docs/user-workflow.md) for the schematic-to-layout steps
and the planned upload-and-viewer experience. No account or external AI service
is needed for the current CLI.

## Quick start

Requires **Python 3.11+**. Run these commands from the repository root; the current
analysis package has no third-party runtime dependencies and needs no installation:

```sh
python3 -m boardlint tests/fixtures/trace_width.kicad_pcb --min-trace-width 0.2
```

The synthetic example produces one finding:

```text
WARNING: Trace on +5V is 0.15 mm wide, below your configured 0.2 mm threshold.
```

The full report includes the affected object, layer, location, rationale, and
coverage limitations. The example threshold is a review preference, not a
universal manufacturing or electrical requirement.

### Review your board

```sh
python3 -m boardlint "/path/to/your-board.kicad_pcb" --min-trace-width 0.2
```

Choose the threshold for your project. For machine-readable output:

```sh
python3 -m boardlint "/path/to/your-board.kicad_pcb" --min-trace-width 0.2 --format json > review.json
```

Add `--fail-on-findings` when a script should return a nonzero exit code for findings.

| Exit code | Meaning |
| --- | --- |
| `0` | Analysis completed; findings may still be present |
| `1` | Findings present and `--fail-on-findings` enabled |
| `2` | Invalid input/configuration, unsupported format, or file error |

JSON goes to stdout and errors go to stderr. Analysis leaves the input unchanged
and makes no network requests.

### Optional command installation

To install the `boardlint` command in a virtual environment on macOS/Linux:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -e .
.venv/bin/boardlint your-board.kicad_pcb --min-trace-width 0.2
```

## Project structure

```text
boardlint/
  parsers/       KiCad input validation and extraction
  models.py      Normalized board objects and findings
  rules/         Individual deterministic checks
  analysis.py    Rule execution and report composition
  services/      Shared file-to-report entry point
  cli.py         Arguments and text/JSON presentation
tests/
  fixtures/      Small synthetic boards
docs/            PRD, roadmap, architecture, and guides
.github/         Automated test workflow
Makefile         Development commands
pyproject.toml   Python package configuration
```

The parser, model, rules, and interface are separate so the future HTTP API can
reuse the same review service. Frontend, API, database, and AI services are not
implemented yet.

## Development and validation

```sh
make test        # Automated tests
make demo        # Example text report
make demo-json   # Example JSON report
make check       # Tests and patch whitespace check
```

Without Make, run `python3 -m unittest discover -s tests -v` and the quick-start
commands above.

The foundation has 10 passing local tests. Initial real-file validation covered
19 installed KiCad templates and the routed StickHub example, with native KiCad
cross-checks for track findings. This establishes limited data-extraction evidence,
not broad compatibility or engineering usefulness. See [validation evidence](docs/validation.md)
for the exact scope and outstanding checks.

## Roadmap

1. **Foundation:** parser, normalized model, one tested rule, and CLI — implemented
   with the limitations above.
2. **Geometry:** validated outlines and component geometry for edge-clearance review.
3. **CLI MVP:** approximately five reliable rules, configuration, grouping, and
   reasoned suppressions, calibrated on real boards.
4. **Web pilot:** upload, understandable reports, and a 2D viewer with linked findings.
5. **Later:** contextual heuristics, revision comparison, CI integration, and optional
   AI explanations grounded in measured evidence.

The [12–16 week roadmap](docs/roadmap.md) defines milestone gates. Accuracy and
useful feedback take priority over adding features to meet a date.

## Documentation

| Document | Purpose |
| --- | --- |
| [PRD](docs/PRD.md) | Scope, requirements, acceptance criteria, and success measures |
| [Product brief](docs/product-brief.md) | Vision, intended users, and product boundaries |
| [User workflow](docs/user-workflow.md) | Prepare a board and understand the review process |
| [Development guide](docs/development.md) | Run the project and extend the foundation |
| [Architecture](docs/architecture.md) | Processing boundaries, decisions, and limitations |
| [Rule development](docs/rule-development.md) | Evidence and testing expectations for each rule |
| [Roadmap](docs/roadmap.md) | Implementation sequence and next tasks |
| [Validation](docs/validation.md) | Verified behavior and remaining gaps |

BoardLint assists engineering judgment. A high-confidence measurement is not a
prediction that a board will fail, and a report with no findings is not proof that
the board will work or pass fabrication.
