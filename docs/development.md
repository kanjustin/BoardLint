# Development guide

## Base structure

```text
BoardLint/
├── boardlint/                 Python analysis package
│   ├── __main__.py            python -m boardlint entry point
│   ├── cli.py                 Arguments and text/JSON presentation
│   ├── services/
│   │   └── review.py          File-to-report application entry point
│   ├── parsers/
│   │   └── kicad.py           KiCad syntax validation and extraction
│   ├── models.py             Normalized board objects and findings
│   ├── analysis.py           Rule execution and report composition
│   └── rules/
│       └── trace_width.py    First deterministic check
├── tests/
│   ├── fixtures/             Small synthetic board inputs
│   ├── test_analysis.py      Parser, rule and CLI regression tests
│   └── test_review_service.py  Shared entry point and input guidance
├── docs/                     PRD, roadmap, architecture and guides
├── .github/workflows/        Automated test configuration
├── Makefile                  Test and demo commands
├── pyproject.toml            Python package and command definition
├── AGENTS.md                 Development principles
└── README.md                 Start here
```

The Python package is the processing foundation. An HTTP adapter and frontend
will be added when their roadmap milestones begin. They are not implemented
services or empty application scaffolds today. A database is unnecessary for the
current local review flow.

## Run locally

From the repository root, use Python 3.11 or newer. The current runtime needs no
third-party packages:

```sh
make test
make demo
make demo-json
```

Without Make, use the equivalent `python3 -m unittest discover -s tests -v` and
`python3 -m boardlint` commands in the README. Override the interpreter with
`make test PYTHON=/path/to/python` if needed.

The demo uses a synthetic fixture with one below-threshold segment. Its 0.20 mm
threshold is an example review preference, not an engineering recommendation.

## Reuse the application entry point

```python
from pathlib import Path
from boardlint.services import review_file

report = review_file(
    Path("your-board.kicad_pcb"),
    minimum_trace_width_mm=0.2,  # Choose a threshold for your own review.
)
```

`review_file` returns data and leaves file/error presentation to the caller.
It does not write a report, modify the PCB, upload data, or start a server.
A future API can stage a validated upload in a bounded temporary job and invoke
this function. Upload limits, job isolation and cleanup belong to that adapter.

## Add a feature

1. Start with a small board fixture and an independently checked expected result.
2. Add normalized model fields only when the rule needs them.
3. Extract those fields in the parser; document unsupported cases.
4. Implement the rule against the model, with explicit measurement semantics.
5. Wire it into analysis and make its coverage visible in reports.
6. Test boundaries, negative cases, locations and incomplete prerequisites.
7. Run `make check` and update the rule and validation documentation.

Next milestone: a repeatable real-board corpus and validated outline/courtyard
geometry for component-to-edge review. Follow the [roadmap](roadmap.md) for scope.
