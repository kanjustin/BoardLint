"""Read a deliberately limited subset of modern KiCad board data.

This is not a complete KiCad validator. Unmodeled data is disclosed in every
report. Only explicitly tested file versions are accepted.
"""

import math
import re
from pathlib import Path

from boardlint.models import Board, Component, Point, Track, Via

SUPPORTED_VERSIONS = {20241229}  # KiCad 9; expand only with fixture evidence.
MAX_BYTES = 25 * 1024 * 1024
TOKEN = re.compile(r'\s+|;[^\n]*|[()]|"(?:\\.|[^"\\])*"|[^\s()";]+')


class ParseError(ValueError):
    """Unreadable or unsupported input; no analysis was performed."""


def sexpr(text: str) -> list:
    roots, stack = [], []
    end = 0
    for match in TOKEN.finditer(text):
        if match.start() != end:
            raise ParseError(f"Invalid token at character {end}")
        end = match.end()
        token = match.group()
        if token.isspace() or token.startswith(';'):
            continue
        if token == '(':
            node = []
            (stack[-1] if stack else roots).append(node)
            stack.append(node)
            if len(stack) > 128:
                raise ParseError("Input exceeds nesting limit (128)")
        elif token == ')':
            if not stack:
                raise ParseError("Unexpected closing parenthesis")
            stack.pop()
        else:
            if not stack:
                raise ParseError("Unexpected content outside board")
            if token.startswith('"'):
                escapes = {'n': '\n', 'r': '\r', 't': '\t', '"': '"', '\\': '\\'}
                token = re.sub(r'\\(.)', lambda m: escapes.get(m[1], '\\' + m[1]), token[1:-1])
            stack[-1].append(token)
    if end != len(text) or stack or len(roots) != 1:
        raise ParseError("Incomplete input or multiple root expressions")
    return roots[0]


def children(node: list, key: str) -> list[list]:
    return [item for item in node if isinstance(item, list) and item and item[0] == key]


def field(node: list, key: str, default=None) -> list:
    matches = children(node, key)
    if len(matches) > 1:
        raise ParseError(f"Duplicate {key} field in {node[0]}")
    if matches:
        return matches[0][1:]
    if default is not None:
        return default
    raise ParseError(f"Missing {key} field in {node[0]}")


def number(value, positive=False) -> float:
    result = float(value)
    if not math.isfinite(result) or (positive and result <= 0):
        raise ParseError(f"Invalid measurement: {value}")
    return result


def point(node: list, key: str) -> Point:
    values = field(node, key)
    return Point(number(values[0]), number(values[1]))


def identifier(node: list, index: int) -> str:
    return str(field(node, 'uuid', field(node, 'tstamp', [f'{node[0]}:{index}']))[0])


def parse_text(text: str) -> Board:
    try:
        return _parse(text)
    except ParseError:
        raise
    except (ValueError, TypeError, IndexError, KeyError) as exc:
        raise ParseError(f"Malformed board field: {exc}") from exc


def _parse(text: str) -> Board:
    if len(text.encode('utf-8')) > MAX_BYTES:
        raise ParseError("Input exceeds 25 MiB limit")
    root = sexpr(text)
    if root and root[0] == 'kicad_sch':
        raise ParseError('This is a KiCad schematic. BoardLint currently reviews PCB layouts; '
                         'save the board from the KiCad PCB Editor and select its .kicad_pcb file.')
    if not root or root[0] != 'kicad_pcb':
        raise ParseError("Expected a kicad_pcb root")
    version = int(field(root, 'version')[0])
    if version not in SUPPORTED_VERSIONS:
        raise ParseError(f"Unsupported board format {version}; currently tested: 20241229 (KiCad 9)")
    layers = tuple(item[1] for item in field(root, 'layers'))
    nets = {}
    for node in children(root, 'net'):
        net_id = int(node[1])
        if net_id in nets:
            raise ParseError(f"Duplicate net ID {net_id}")
        nets[net_id] = node[2]
    nets.setdefault(0, '')
    components, tracks, vias = [], [], []
    seen = set()
    for index, node in enumerate(root[1:]):
        if not isinstance(node, list) or not node:
            continue
        kind = node[0]
        if kind not in {'segment', 'arc', 'footprint', 'via'}:
            continue
        obj_id = identifier(node, index)
        if obj_id in seen:
            raise ParseError(f"Duplicate object ID {obj_id}")
        seen.add(obj_id)
        if kind == 'footprint':
            props = {p[1]: p[2] for p in children(node, 'property')}
            texts = {p[1]: p[2] for p in children(node, 'fp_text')}
            at = field(node, 'at')
            components.append(Component(obj_id, props.get('Reference', texts.get('reference', '?')),
                                        node[1], point(node, 'at'), number(at[2]) if len(at) > 2 else 0,
                                        field(node, 'layer')[0]))
            continue
        net_id = int(field(node, 'net')[0])
        if net_id not in nets:
            raise ParseError(f"Unknown net {net_id} on {obj_id}")
        if kind in {'segment', 'arc'}:
            layer = field(node, 'layer')[0]
            if layer not in layers or not layer.endswith('.Cu'):
                raise ParseError(f"Invalid copper layer {layer} on {obj_id}")
            tracks.append(Track(obj_id, kind, point(node, 'start'), point(node, 'end'),
                                number(field(node, 'width')[0], positive=True), layer, net_id,
                                point(node, 'mid') if kind == 'arc' else None))
        else:
            vias.append(Via(obj_id, point(node, 'at'), number(field(node, 'size')[0], positive=True),
                            number(field(node, 'drill')[0], positive=True), tuple(field(node, 'layers')), net_id))
    return Board(version, layers, nets, tuple(components), tuple(tracks), tuple(vias), (
        'Only explicit segment/arc widths are analyzed; this is not a full design review.',
        'Pads, zones, board outlines, connectivity and component extents are not yet modeled.',
        'Thresholds are user review preferences, not manufacturing or current-capacity guarantees.',
    ))


def parse_file(path: Path) -> Board:
    with path.open('rb') as stream:
        data = stream.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ParseError("Input exceeds 25 MiB limit")
    return parse_text(data.decode('utf-8-sig'))
