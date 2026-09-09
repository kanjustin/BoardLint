"""Small normalized model. Positions are board coordinates in millimeters."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Point:
    x: float
    y: float


@dataclass(frozen=True)
class Track:
    id: str
    kind: str
    start: Point
    end: Point
    width_mm: float
    layer: str
    net_id: int
    mid: Point | None = None


@dataclass(frozen=True)
class Component:
    id: str
    reference: str
    footprint: str
    position: Point
    rotation_deg: float
    layer: str


@dataclass(frozen=True)
class Via:
    id: str
    position: Point
    diameter_mm: float
    drill_mm: float
    layers: tuple[str, ...]
    net_id: int


@dataclass(frozen=True)
class Board:
    format_version: int
    layers: tuple[str, ...]
    nets: dict[int, str]
    components: tuple[Component, ...]
    tracks: tuple[Track, ...]
    vias: tuple[Via, ...]
    limitations: tuple[str, ...]


@dataclass(frozen=True)
class Finding:
    id: str
    rule_id: str
    rule_version: str
    severity: str
    confidence: str
    origin: str
    title: str
    object_id: str
    object_kind: str
    layer: str
    net_name: str
    location: Point
    measured_value: float
    threshold: float
    unit: str
    message: str
    why_it_matters: str
    suggested_action: str
