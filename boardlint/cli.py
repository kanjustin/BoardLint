"""Local CLI: no network requests or upload of design data."""

import argparse
import json
import sys
from pathlib import Path

from boardlint.parsers.kicad import ParseError
from boardlint.services import review_file


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description='BoardLint experimental KiCad design review')
    parser.add_argument('board', type=Path)
    parser.add_argument('--min-trace-width', type=float, required=True, metavar='MM',
                        help='Your review threshold; not a universal engineering limit')
    parser.add_argument('--format', choices=['text', 'json'], default='text')
    parser.add_argument('--fail-on-findings', action='store_true')
    args = parser.parse_args(argv)
    try:
        report = review_file(args.board, minimum_trace_width_mm=args.min_trace_width)
    except (OSError, UnicodeError, ParseError, ValueError) as exc:
        print(f'BoardLint: {exc}', file=sys.stderr)
        return 2
    if args.format == 'json':
        print(json.dumps(report, indent=2, sort_keys=True, allow_nan=False))
    else:
        print('BoardLint - experimental review')
        print(' | '.join(f'{key}: {value}' for key, value in report['board'].items()))
        print(f"Status: {report['status']}\n")
        for finding in report['findings']:
            print(f"WARNING: {finding['message']}")
            print(f"  Object: {finding['object_id']} | Layer: {finding['layer']} | {finding['location']}")
            print(f"  Why: {finding['why_it_matters']}")
            print(f"  Consider: {finding['suggested_action']}\n")
        print(f"{len(report['findings'])} finding(s)")
        for limitation in report['limitations']:
            print(f'Coverage: {limitation}')
    return 1 if args.fail_on_findings and report['findings'] else 0
