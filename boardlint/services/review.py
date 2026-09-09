"""Coordinate a local review without presentation or transport concerns."""

from pathlib import Path

from boardlint.analysis import analyze
from boardlint.parsers.kicad import parse_file


def review_file(path: Path, *, minimum_trace_width_mm: float) -> dict:
    """Read a board and return its report without modifying it or writing output.

    Input and configuration errors propagate to the caller. Adapters decide how
    to present those errors; rules remain independent of files and interfaces.
    """
    board = parse_file(path)
    return analyze(board, minimum_trace_width_mm)
