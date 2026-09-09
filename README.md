# BoardLint

Automated, explainable PCB design review, starting with KiCad.

BoardLint measures design data, applies explicit review rules, and reports what
was found, where it occurs, and why it may deserve attention. The long-term
product combines this engine with an interactive viewer, education, revision
comparison, CI, and optional AI explanations.

**Status: first experimental CLI slice, not the five-rule MVP.** Currently reads
KiCad 9 board format `20241229`, extracts components, tracks, vias, layers and nets,
and checks segment/arc widths against an explicitly supplied threshold. Pads,
outlines, zones, component extents and electrical connectivity are not yet modeled.
No finding means only that the executed check found nothing.

## Try it

Python 3.11+; no runtime dependencies or installation required from this directory:

```sh
python3 -m boardlint tests/fixtures/trace_width.kicad_pcb --min-trace-width 0.2
python3 -m boardlint tests/fixtures/trace_width.kicad_pcb --min-trace-width 0.2 --format json
python3 -m unittest discover -s tests -v
```

Shortcuts: `make demo`, `make demo-json`, and `make test`.
See the [development guide](docs/development.md) for the package structure and
the [user workflow](docs/user-workflow.md) for preparing a board for review.

The fixture produces one finding: a 0.15 mm segment is below the supplied
0.20 mm threshold. This example threshold is not a universal PCB recommendation.
High confidence means confidence in the width comparison, not in predicted failure.

To install the `boardlint` command in a virtual environment:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -e .
.venv/bin/boardlint your-board.kicad_pcb --min-trace-width 0.2
```

Exit codes: `0` analysis completed; `1` findings with `--fail-on-findings`;
`2` invalid input/configuration or file error. JSON goes to stdout; errors to stderr.
The CLI processes designs locally and makes no network requests.

## Project direction

- [Product requirements document](docs/PRD.md)
- [Product interpretation and boundaries](docs/product-brief.md)
- [12–16 week roadmap and immediate backlog](docs/roadmap.md)
- [Architecture, parser research and decisions](docs/architecture.md)
- [Rule contract and testing expectations](docs/rule-development.md)
- [Current validation evidence](docs/validation.md)

The core assists engineering judgment. It does not certify that a PCB will work
or pass fabrication. Useful, traceable findings take priority over feature count.
