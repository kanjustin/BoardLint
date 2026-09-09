"""Verify the reusable review boundary and user-facing file guidance."""

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from boardlint.cli import main
from boardlint.parsers.kicad import ParseError
from boardlint.services import review_file

FIXTURE = Path(__file__).parent / 'fixtures' / 'trace_width.kicad_pcb'


class ReviewServiceTests(unittest.TestCase):
    def test_cli_and_service_agree_without_mutating_input(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'board with spaces.kicad_pcb'
            original = FIXTURE.read_bytes()
            path.write_bytes(original)
            report = review_file(path, minimum_trace_width_mm=0.2)
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                code = main([str(path), '--min-trace-width', '0.2', '--format', 'json'])
            self.assertEqual(code, 0)
            self.assertEqual(json.loads(output.getvalue()), report)
            self.assertEqual(path.read_bytes(), original)
            self.assertEqual(list(Path(directory).iterdir()), [path])

    def test_schematic_content_gets_actionable_guidance_even_if_renamed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'renamed.kicad_pcb'
            path.write_text('(kicad_sch (version 20250114))')
            with self.assertRaisesRegex(ParseError, 'KiCad schematic'):
                review_file(path, minimum_trace_width_mm=0.2)
            output, errors = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
                code = main([str(path), '--min-trace-width', '0.2'])
            self.assertEqual(code, 2)
            self.assertEqual(output.getvalue(), '')
            self.assertIn('PCB Editor', errors.getvalue())
            self.assertIn('.kicad_pcb', errors.getvalue())
