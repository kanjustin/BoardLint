"""Compare explicit copper track widths with a user's review threshold."""

import math

from boardlint.models import Board, Finding

RULE_ID = 'trace_width'


def check(board: Board, minimum_mm: float) -> tuple[Finding, ...]:
    if not math.isfinite(minimum_mm) or minimum_mm <= 0:
        raise ValueError('Minimum trace width must be finite and greater than zero')
    findings = []
    for track in sorted(board.tracks, key=lambda t: t.id):
        if track.width_mm >= minimum_mm:
            continue
        net_name = board.nets[track.net_id]
        findings.append(Finding(
            id=f'{RULE_ID}:{track.id}', rule_id=RULE_ID, rule_version='1',
            severity='warning', confidence='high', origin='deterministic',
            title='Trace below configured width', object_id=track.id,
            object_kind=track.kind, layer=track.layer, net_name=net_name,
            location=track.start, measured_value=track.width_mm,
            threshold=minimum_mm, unit='mm',
            message=f'Trace on {net_name or "unassigned net"} is {track.width_mm:g} mm wide, '
                    f'below your configured {minimum_mm:g} mm threshold.',
            why_it_matters='Trace width is one input to manufacturing and electrical review. '
                           'This comparison alone does not establish whether the trace is unsuitable.',
            suggested_action='Review the intended current, copper thickness and fabricator constraints. '
                             'Adjust the routing or review threshold if appropriate.',
        ))
    return tuple(findings)
