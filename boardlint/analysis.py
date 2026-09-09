"""Compose normalized board data and rules into a serializable report."""

from dataclasses import asdict

from boardlint.models import Board
from boardlint.rules.trace_width import check


def analyze(board: Board, minimum_trace_width_mm: float) -> dict:
    findings = check(board, minimum_trace_width_mm)
    return {
        'schema_version': '0.1',
        'status': 'review_recommended' if findings else 'no_findings_in_executed_rules',
        'board': {'format_version': board.format_version, 'components': len(board.components),
                  'tracks': len(board.tracks), 'vias': len(board.vias), 'layers': len(board.layers)},
        'rules_executed': [{'id': 'trace_width', 'version': '1',
                            'parameters': {'minimum_mm': minimum_trace_width_mm}}],
        'limitations': list(board.limitations),
        'findings': [asdict(finding) for finding in findings],
    }
