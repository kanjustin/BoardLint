import contextlib
import io
import json
import unittest
from pathlib import Path

from boardlint.analysis import analyze
from boardlint.cli import main
from boardlint.parsers.kicad import ParseError, parse_text, sexpr
from boardlint.rules.trace_width import check

FIXTURE = Path(__file__).parent / 'fixtures' / 'trace_width.kicad_pcb'


class AnalysisTests(unittest.TestCase):
    def setUp(self):
        self.text = FIXTURE.read_text()
        self.board = parse_text(self.text)

    def test_normalized_objects(self):
        self.assertEqual((len(self.board.components), len(self.board.tracks), len(self.board.vias)), (1, 3, 1))
        self.assertEqual(self.board.components[0].reference, 'R1')
        self.assertEqual(self.board.components[0].rotation_deg, 90)
        self.assertEqual(self.board.tracks[0].start.x, 10)
        self.assertEqual(self.board.tracks[2].mid.y, 15)
        self.assertEqual(self.board.vias[0].drill_mm, 0.3)

    def test_threshold_boundary_and_evidence(self):
        findings = check(self.board, 0.2)
        self.assertEqual(len(findings), 1)  # Equal and above do not fire.
        finding = findings[0]
        self.assertEqual(finding.measured_value, 0.15)
        self.assertEqual(finding.threshold, 0.2)
        self.assertEqual(finding.net_name, '+5V')
        self.assertEqual(finding.object_id, self.board.tracks[0].id)
        self.assertEqual(finding.location, self.board.tracks[0].start)

    def test_arcs_checked_and_threshold_configurable(self):
        self.assertEqual(len(check(self.board, 0.3)), 3)
        self.assertEqual(check(self.board, 0.1), ())

    def test_invalid_thresholds(self):
        for value in [0, -1, float('nan'), float('inf')]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                check(self.board, value)

    def test_repeatable_report_and_clean_status(self):
        self.assertEqual(analyze(self.board, 0.2), analyze(parse_text(self.text), 0.2))
        report = analyze(self.board, 0.1)
        self.assertEqual(report['status'], 'no_findings_in_executed_rules')
        self.assertTrue(report['limitations'])

    def test_malformed_or_unsupported_input(self):
        inputs = ['', '()', ')', self.text[:-2], self.text + '()',
                  self.text.replace('20241229', '20990101'),
                  self.text.replace('(width 0.15)', '(width nan)'),
                  self.text.replace('(width 0.15)', '(width -1)'),
                  self.text.replace('(width 0.15)', ''),
                  self.text.replace('(net 1)', '(net 999)'),
                  self.text.replace('(width 0.15)', '(width 0.15) (width 0.2)'),
                  self.text.replace('000000000003', '000000000002')]
        for value in inputs:
            with self.subTest(value=value[:60]), self.assertRaises(ParseError):
                parse_text(value)

    def test_strings_and_nesting(self):
        self.assertEqual(sexpr('(a "µ (test) \\"quote\\"" "C:\\\\test")'),
                         ['a', 'µ (test) "quote"', 'C:\\test'])
        with self.assertRaises(ParseError):
            sexpr('(a "unterminated)')
        with self.assertRaises(ParseError):
            sexpr('(' * 129 + ')' * 129)

    def test_cli_json_exit_codes(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = main([str(FIXTURE), '--min-trace-width', '0.2', '--format', 'json', '--fail-on-findings'])
        self.assertEqual(code, 1)
        self.assertEqual(len(json.loads(out.getvalue())['findings']), 1)
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(main([str(FIXTURE), '--min-trace-width', '0.1', '--fail-on-findings']), 0)
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main([str(FIXTURE), '--min-trace-width', 'nan']), 2)
            self.assertEqual(main(['missing.kicad_pcb', '--min-trace-width', '0.2']), 2)


if __name__ == '__main__':
    unittest.main()
