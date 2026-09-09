PYTHON ?= python3
DEMO_BOARD := tests/fixtures/trace_width.kicad_pcb

.PHONY: help test demo demo-json check

help:
	@echo "make test       Run automated tests"
	@echo "make demo       Review the synthetic example (text)"
	@echo "make demo-json  Review the synthetic example (JSON)"
	@echo "make check      Run tests and check patch whitespace"

test:
	$(PYTHON) -m unittest discover -s tests -v

demo:
	$(PYTHON) -m boardlint $(DEMO_BOARD) --min-trace-width 0.2

demo-json:
	@$(PYTHON) -m boardlint $(DEMO_BOARD) --min-trace-width 0.2 --format json

check: test
	git diff --check
