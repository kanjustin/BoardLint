# BoardLint development

Read README.md, docs/product-brief.md and docs/roadmap.md before changing scope.
These documents interpret the owner's September 2026 project description.

- Keep the MVP small. Finish tested vertical features before expanding systems.
- Measurements come from software. Do not add AI before deterministic analysis works.
- Keep parser, normalized model, rules, API and UI separate.
- Every rule needs positive, negative and boundary fixtures with independent expected values.
- Document measurement semantics, threshold provenance, assumptions and incomplete coverage.
- Never equate a footprint origin with its physical body or courtyard clearance.
- Never infer current capacity or electrical intent solely from a net name or width.
- Label deterministic, heuristic and AI origins distinctly. Severity and confidence differ.
- Findings need source object IDs, units, locations, evidence and understandable explanations.
- Missing required data means a skipped/unsupported check, not a pass.
- Favor fewer useful findings; do not invent universal engineering limits.
- No accounts, billing, simulation, autorouting or AI redesign in the MVP.
- Keep source designs local by default; do not commit proprietary user boards without authorization.
- Run `python3 -m unittest discover -s tests -v` and the README CLI example after analysis changes.
- Update docs/validation.md with actual evidence and limitations, not planned capabilities.
