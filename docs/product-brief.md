# Product brief

## Source and interpretation

Reviewed the complete 47-page **BoardLint Project Description.pdf**, supplied by
Justin on September 9, 2026 (56 product sections plus implementation instructions;
last page blank). The original remains in the owner's Downloads folder. This
brief records the intent for ongoing development; it does not replace that source.

BoardLint should help beginner and intermediate PCB designers review a board that
may pass KiCad checks but still contain questionable design choices. Its core value
is measured, repeatable, understandable feedback tied to actual board objects.
The long-term analogy is code review and static analysis for hardware.

## What the experience must deliver

1. Supply a structured KiCad board file.
2. See which checks ran, what data was understood, and what remains unassessed.
3. Read a small, useful set of prioritized findings.
4. Inspect the measurement, rationale, uncertainty and suggested action.
5. Navigate to the affected component, track or net in a board viewer.
6. Eventually compare revisions and see new, resolved and intentional findings.

Education belongs in each finding from the start. A beginner should understand
why to review the condition without being told their board is definitively broken.
An experienced user should be able to inspect the evidence and adjust the rule.

## Non-negotiable principles

- Deterministic measurements and structured findings form the foundation.
- Severity expresses potential impact; confidence expresses evidential certainty.
- Exact measurements do not make an engineering recommendation universally correct.
- Label heuristic relationships and AI observations explicitly.
- Keep source identities and geometry available for the viewer and future diffing.
- Expose incomplete analysis; a clean report is not certification.
- Minimize false positives and support intentional exceptions as the engine grows.
- Preserve a useful local CLI even after a hosted product exists.

## Release boundaries

The first release targets approximately five reliable checks, normalized KiCad
data, understandable structured findings, a CLI or basic display, and automated
tests. Suggested checks are edge clearance, trace width, via size, component spacing,
and long/indirect routing, allowing a simpler fifth rule if routing is unreliable.

The 3–4 month target proposed here adds a basic upload/report flow and linked 2D
viewer if the engine meets accuracy gates. This schedule is a planning assumption,
not a commitment that the full long-term product fits within one term.

Later: relationship-based placement checks, optional grounded AI explanations,
revision comparison, CI integrations, history, profiles, suppressions and plugins.
Avoid initial accounts, billing, teams, image-based understanding, simulation,
autorouting, full schematic interpretation and autonomous redesign.

## Risks that should shape decisions

**Trust:** A noisy result list can destroy usefulness even when the calculations
are correct. Review findings with designers and record intentional exceptions.

**Geometry:** Origin-to-edge distance is not component-to-edge clearance. Outlines
may contain arcs, cutouts and disconnected shapes; footprint geometry has local
coordinates, rotation and side-dependent interpretation.

**Intent:** Power requirements, decoupling relationships and route criticality may
need information absent from `.kicad_pcb`. Unknown context should remain unknown.

**Differentiation:** Simple width/size checks prove the engine but overlap DRC.
The value must grow toward explanation, contextual review, visual navigation and
revision-aware workflow. Five basic checks alone do not establish product fit.

## Proposed early measures

Maintain a versioned board corpus and record parser acceptance, unsupported data,
hand-verified measurement error, useful/intentional/incorrect findings, repeatability,
and whether a designer can locate and explain a finding without help. Measure
precision of reviewed findings separately from recall; an unlabeled corpus cannot
establish recall. Choose numerical product targets after the first pilot baseline.

## Owner decisions to revisit

Weekly development availability; access to real boards and PCB reviewers; preferred
initial KiCad versions; first target board types; CLI-first versus web-first pilot;
and licensing/public release preference. None blocks the current local prototype.
