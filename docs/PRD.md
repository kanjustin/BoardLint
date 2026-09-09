# BoardLint — Product Requirements Document

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Initial draft for product planning; proposed decisions are identified below |
| Product owner | Justin Kan |
| Created | September 9, 2026 |
| Planning horizon | 12–16 weeks, approximately September–December 2026 |
| Primary source | Owner-provided *BoardLint Project Description.pdf*, sections 1–57 |
| Related documents | [Roadmap](roadmap.md), [architecture](architecture.md), [rule contract](rule-development.md), [validation evidence](validation.md) |

This PRD translates the project description into testable product requirements.
It distinguishes required behavior from implemented behavior. The source description
governs the vision; this document defines proposed release scope and acceptance.
New targets and implementation choices are planning proposals, not claims of owner
approval or validated market demand.

## 1. Product summary

BoardLint is an automated PCB design-review platform. It reads structured KiCad
design files, measures board properties, applies explicit rules, and presents
potential concerns with evidence, explanations, and locations.

The product helps designers answer: **“My PCB passes its configured checks, but
what design decisions should I review before fabrication?”**

The foundation is a deterministic analysis engine and a useful local CLI. The
experience grows into an interactive board viewer, educational feedback, revision
comparison, and automated review workflows. Optional AI can explain structured
evidence later. It must not invent measurements or become necessary for core analysis.

BoardLint assists engineering judgment. It does not certify electrical operation,
manufacturing success, regulatory compliance, or overall design correctness.

## 2. Problem and product opportunity

Designers can make questionable placement and routing decisions without violating
their configured design rules. Beginners may also struggle to understand the
consequences of a warning or locate the relevant geometry. Manual review requires
time and access to experienced reviewers.

BoardLint should make review repeatable and accessible by connecting each concern
to a measurable condition and an understandable explanation. Its long-term value
comes from the combination of analysis, visual navigation, education, change tracking,
and workflow integration.

Basic width and size checks establish the technical foundation but overlap existing
DRC functionality. A successful pilot must demonstrate value in interpretation,
usability, or review workflow beyond reproducing raw violations.

## 3. Intended users and jobs

| User | Situation | Job to be done | Desired outcome |
| --- | --- | --- | --- |
| Beginner KiCad designer | Preparing an early board for fabrication | Understand which decisions deserve attention and why | Make informed revisions and learn from concrete examples |
| Intermediate hobbyist or student | Reviewing a more complex personal or team project | Run consistent checks without manually inspecting every object | Find useful concerns quickly and recognize intentional exceptions |
| Experienced reviewer, secondary user | Helping others review designs | Inspect evidence, tune thresholds, and dismiss irrelevant observations | Spend review time on meaningful decisions |
| Hardware team, future user | Reviewing successive revisions in Git | Identify new and resolved concerns automatically | Incorporate PCB review into development workflows |

Initial recruiting should prioritize beginner and intermediate KiCad users with
boards they can share for evaluation. Enterprise collaboration is outside the pilot.

## 4. Goals and principles

1. Produce repeatable findings grounded in explicit board data.
2. Explain what was measured, why it was flagged, and what to consider next.
3. Preserve source identities and geometry so users can locate each concern.
4. Prefer a small set of useful findings over a large volume of weak advice.
5. Make uncertainty, intentional exceptions, and incomplete coverage visible.
6. Deliver a complete, tested feature before expanding the rule catalog.
7. Keep local analysis useful independently of hosting or AI.

Severity and confidence describe different properties. A high-confidence width
comparison is not a high-confidence prediction that the board will fail. Review
thresholds must have an explicit source; illustrative values are not universal
engineering limits.

## 5. Release scope

Release labels below are product milestones, not package-version promises.

| Capability | R0: foundation | R1: CLI MVP | R2: web pilot | Later |
| --- | --- | --- | --- | --- |
| Limited KiCad reader and normalized model | Required | Expanded for selected rules | Shared with CLI | Additional formats/versions |
| One deterministic rule with evidence | Required | Included | Included | — |
| Approximately five reliable rules | — | Required | Included | Broader contextual analysis |
| Human-readable and JSON reports | Required | Required | Downloadable report | Other export formats |
| Rule configuration and coverage reporting | Basic | Required | Required | Named manufacturing profiles |
| Grouping and reasoned suppressions | — | Required before external pilot | Required | Team policies |
| HTTP analysis and upload flow | — | — | Required | Hosted history |
| Basic 2D viewer with finding navigation | — | — | Required | Rich net/component inspection |
| AI explanations and Q&A | — | — | — | Optional |
| Revision comparison and Git integrations | — | — | — | Strategic follow-on |

R1 is the minimum useful release. R2 is the proposed 3–4 month target, contingent
on accuracy and usability gates. If capacity is constrained, reduce R2 scope or
defer it; do not weaken evidence requirements to meet a date.

### Explicit non-goals for R1 and R2

- Accounts, billing, team collaboration, and persistent project history.
- PCB editing, autorouting, autonomous redesign, or replacing KiCad.
- Full circuit, thermal, power, or signal-integrity simulation.
- Image-first PCB interpretation or complete schematic understanding.
- Large rule libraries, marketplaces, desktop/mobile apps, and editor plugins.
- An overall numeric design score or claims that a clean report proves correctness.

## 6. Core user journeys

### Local review, R1

The user selects a supported `.kicad_pcb` file and review configuration, runs the
CLI, and receives a summary of completed and skipped checks. They inspect grouped
findings, read the evidence, and use source references and coordinates to locate
the affected objects in KiCad. They adjust the board or mark an observation as
intentional, then rerun the same configuration.

Acceptance: the same input bytes, configuration, and engine version produce the
same substantive report. An invalid file yields a clear error and no success report.

### Visual review, R2

The user selects a board, sees the accepted format and upload handling policy,
then starts analysis. Progress leads to a board view and findings panel. Selecting
a finding focuses the affected area, reveals its layer, and displays the measurement,
threshold, explanation, and possible action. They can filter findings and download
the report without creating an account.

Acceptance: the highlighted geometry matches the finding's source objects. HTTP
and CLI analysis agree for the same board, configuration, and engine version.

### Intentional exception, R1 onward

The user recognizes an intentional condition, such as an edge-mounted connector,
and suppresses that specific finding with a reason. On the next run, the exception
appears separately from active findings. The user can inspect and remove it.

Acceptance: suppression never deletes evidence or affects unrelated objects.
If a target cannot be resolved reliably, the exception is reported as unmatched.

## 7. Functional requirements

“Must” denotes acceptance criteria for the specified release. Later requirements
do not block R1 or R2.

### 7.1 Input and normalized data

| ID | Release | Requirement and acceptance criteria |
| --- | --- | --- |
| IN-01 | R1 | Accept `.kicad_pcb` content for explicitly supported versions. Publish a compatibility matrix; reject unsupported versions with actionable guidance. Do not rely on the filename alone. |
| IN-02 | R1 | Extract components, pads, nets, tracks, vias, layers, and outline geometry needed by shipped rules. Retain source IDs, units, rotations, and layer information. Zones may remain unsupported if dependent analysis is explicitly excluded. |
| IN-03 | R1 | Normalize geometry into a documented coordinate system. Independently verify rotated/back-side footprints and outline geometry before using them in rules. |
| IN-04 | R1 | Distinguish malformed input from valid but unassessed features. A missing outline or courtyard skips only dependent checks, with a reason; unrelated checks can complete. |
| IN-05 | R1 | Preserve the original input without modification. Do not infer unmodeled geometry from a footprint origin or silently replace complex shapes with misleading approximations. |

Initial compatibility target: the currently tested KiCad 9 format `20241229`.
Additional versions require corpus evidence and explicit compatibility updates.

### 7.2 Rule execution and configuration

| ID | Release | Requirement and acceptance criteria |
| --- | --- | --- |
| AN-01 | R1 | Execute modular rules against normalized data. Each rule declares ID, version, category, prerequisites, parameter definitions, measurement semantics, and limitations. |
| AN-02 | R1 | Report each selected rule as completed, partially assessed, skipped, or failed, including reasons and relevant object counts. A partial/failed run must not appear fully assessed. |
| AN-03 | R1 | Support persisted review configuration and explicit CLI overrides. Proposed precedence: override, then project configuration, then documented default. Missing required thresholds and invalid values produce configuration errors. |
| AN-04 | R1 | Allow individual rules to be disabled. Include disabled rules in coverage reporting and record effective configuration in the report. |
| AN-05 | R1 | Keep execution deterministic. Repeated runs preserve finding identities and ordering for unchanged input/configuration/version. |
| AN-06 | R1 | Include input digest, engine version, report schema version, executed rule versions, and effective parameters so results are reproducible. |

### 7.3 Initial rule set

The source proposes approximately five checks and permits substitutions for difficult
connectivity analysis. The following set is the proposed R1 scope. All thresholds
are configurable review preferences unless a documented user-supplied constraint
provides stronger context.

| Rule ID | Detection and evidence | Preconditions and exclusions |
| --- | --- | --- |
| `trace_width` | Stored segment/arc width below configured minimum; report object, width, threshold, net, layer, and location | No inferred current capacity or power classification; equality does not trigger |
| `component_edge_clearance` | Component courtyard-to-board-boundary clearance below threshold; report component, boundary, nearest points, and measurement | Courtyard is an explicitly labeled placement proxy, not physical body certainty; handle cutouts and outside/intersecting geometry separately; skip missing/unsupported geometry |
| `via_diameter` | Via diameter below configured minimum; report position, diameter, threshold, layers, and via type | State supported via types; do not imply a fabricator limit unless supplied |
| `component_spacing` | Courtyards on the same board side overlap or fall below configured separation; report both components and measured relationship | Avoid duplicate pairs; opposite-side overlap alone is not a collision; no 3D clearance claim |
| `via_drill_diameter` | Stored via drill diameter below configured minimum; report drill, threshold, position, and via type | Proposed substitute for long/indirect routing; do not infer annular ring or drill manufacturability from this check alone |

Every rule must pass positive, negative, equality/boundary, malformed-prerequisite,
and intentional-exception tests. Geometry rules also require independent expected
measurements and rotation, side, concavity, arc, cutout, and intersection cases for
every advertised supported shape. Unsupported cases must produce visible skips.

Suspicious connectivity and long/indirect routing are deferred until a validated,
layer-aware model handles pads, vias, and relevant copper zones. A sum of track
lengths is not automatically an electrical connection-path length.

### 7.4 Findings and report behavior

| ID | Release | Requirement and acceptance criteria |
| --- | --- | --- |
| RP-01 | R1 | Every finding contains the fields in section 8; descriptions identify the detected condition and avoid unsupported failure claims. |
| RP-02 | R1 | Distinguish severity, confidence, and origin. Generic geometry/preferences should normally produce warnings or suggestions; error/critical requires documented stronger evidence. |
| RP-03 | R1 | Show active findings, suppressed findings, and coverage separately. No-findings copy must say that no findings occurred in assessed checks. |
| RP-04 | R1 | Group repetitive findings while retaining all underlying object evidence. Group labels show affected-object counts; reports must not silently truncate results. |
| RP-05 | R1 | Support rule/object-specific suppressions with reasons and removal. Unmatched or ambiguous targets are visible; positional fallback IDs are not silently trusted across revisions. |
| RP-06 | R1 | Provide a short explanation of why a condition may matter, what context could change its importance, and what the user could consider doing. AI is unnecessary for these explanations. |
| RP-07 | R1 | Provide text and JSON outputs. Configuration/input/execution failure is distinguishable from completed analysis and an optional findings-based exit condition. Publish exit semantics before release. |

Grouping should initially use rule, net where applicable, and spatially related
objects. Exact grouping is an implementation decision; it must not require an
unvalidated assumption that separate tracks form one electrical path.

### 7.5 Web interface and viewer

| ID | Release | Requirement and acceptance criteria |
| --- | --- | --- |
| UI-01 | R2 | Provide file selection/drop area, visible supported formats and size limits, review configuration, and a start action. No account required. |
| UI-02 | R2 | Represent idle, validating, analyzing, completed, partially assessed, and failed states. Recovery guidance preserves user-entered configuration where practical. |
| UI-03 | R2 | Show a results summary, filterable issue list, selected-finding details, and basic 2D board view. Filter by severity and rule; include confidence and suppression state in details. |
| UI-04 | R2 | Support pan, zoom, layer visibility, and finding selection. Selection focuses the correct geometry; if its layer is hidden, reveal it or provide a clear control to do so. |
| UI-05 | R2 | Display supported board outlines, component/pad geometry, tracks, and vias needed to interpret findings. Explain omitted geometry; do not present an incomplete view as a full rendering. |
| UI-06 | R2 | Keep findings navigable without relying on color alone. Provide keyboard-operable controls, visible focus, and a textual alternative containing references, coordinates, and evidence. |
| UI-07 | R2 | Permit report download. Reuploading a revised board starts a new review; automatic issue comparison is outside R2. |

## 8. Finding data contract

The contract is product-facing; serialization details may evolve under a versioned
schema. Existing prototype fields are a starting point, not the completed contract.

| Field group | Required information |
| --- | --- |
| Identity | Finding ID, rule ID/version, affected object IDs and types |
| Classification | Title, category, severity, confidence, origin (`deterministic`, `heuristic`, or `ai`) |
| Evidence | Measurement name/value/unit, threshold and provenance, comparison, assumptions |
| Location | Board coordinates, layers, component/net references where applicable, highlight geometry or resolvable geometry references |
| Explanation | What was detected, why flagged, why it may matter, uncertainty, possible action |
| Review state | Active/suppressed status and suppression reason when applicable |

Example wording: “This segment is 0.15 mm wide, below your configured 0.20 mm
review threshold. Review the intended current, copper thickness, and fabricator
constraints before deciding whether a change is needed.” These values illustrate
the comparison; they are not default manufacturing requirements.

## 9. Nonfunctional requirements

| ID | Release | Requirement and verification |
| --- | --- | --- |
| NFR-01 Accuracy | R1 | Independently verify extracted values and finding locations against known fixtures/native KiCad. Define and record justified numerical tolerances per geometry operation; no unexplained mismatches on release fixtures. |
| NFR-02 Reliability | R1 | Malformed, oversized, deeply nested, and unsupported inputs produce controlled errors. Repeated analyses do not corrupt inputs or leak state between boards. |
| NFR-03 Performance | R1/R2 | Proposed pilot budget: p95 analysis within 10 seconds for a documented corpus up to 500 footprints and 10,000 track/via objects on a recorded reference machine. Benchmark before accepting this budget; test file size and geometry complexity separately. |
| NFR-04 Local privacy | R1 | Core CLI works without network access and sends no design data or telemetry externally. Verify with network access disabled. |
| NFR-05 Hosted handling | R2 | Bound upload size, execution time, and worker memory; isolate jobs and prevent cross-user report access. Do not log raw design contents. Test invalid input and unauthorized result access. |
| NFR-06 Retention | R2 | Before upload, state where processing occurs and when designs/results expire. Proposed pilot policy: delete raw files at job completion/failure and expire temporary results within 24 hours; implement cleanup for abandoned jobs and test it before hosting. |
| NFR-07 Maintainability | R1 | Keep parser, model, engine, rule, API, and UI boundaries distinct. A new rule must not require editing a format parser unless it introduces new data requirements. |
| NFR-08 Compatibility | R1 | Publish tested Python/platform/input-version support and run automated checks for every advertised environment. Current local evidence alone does not establish cross-platform compatibility. |

Performance budgets and hosted retention are proposed defaults requiring validation
before the relevant release. The current parser's 25 MiB and 128-level bounds are
prototype limits, not a complete hosted security or performance specification.

## 10. Success measures and evaluation

Feature count alone is insufficient. Evaluate correct measurement, useful review,
understanding, and noise independently.

| Measure | Method | Release use |
| --- | --- | --- |
| Extraction/measurement correctness | Independent expectations and native KiCad comparisons on pinned fixtures | No unexplained mismatches within documented tolerances on release cases |
| Repeatability | Compare normalized reports for repeated input/config/version | Identical substantive reports on release fixtures |
| Coverage honesty | Test missing geometry, unsupported features, and partial failures | Every unassessed prerequisite is visible; no false full-success states |
| Finding usefulness | Reviewers label sampled findings actionable, intentional, incorrect, or unclear | Establish baseline before setting a numerical target; report by rule and board |
| Comprehension and location | Ask pilot users to locate a finding and explain its rationale unaided | Proposed pilot target: at least 4 of 5 observed users complete the task; directional evidence only |
| Review noise | Record raw findings, groups, ignored findings, and time to first useful observation | Identify rules/configurations that overwhelm users; fix or remove them before expansion |
| Continued value | Ask whether users would rerun BoardLint on their next revision and observe repeat use where possible | Inform whether to expand beyond the initial pilot |

Proposed evaluation cohort: 3–5 designers and 10–20 varied boards, with permission
to use each design. If fewer than five users participate, report counts without
treating the comprehension target as established. Small-sample results are exploratory.
Do not claim recall without a corpus labeled for missed issues. Distinguish incorrect
measurements from accurate observations that are intentional or unhelpful.

## 11. Milestones and release gates

| Timing | Milestone | Gate |
| --- | --- | --- |
| Weeks 1–2 | R0: one full analysis path | Parse a real routed board; output a structured finding; independently verify measurements; automated tests pass |
| Weeks 3–4 | Geometry and edge-clearance feature | Validated geometry semantics and visible skips; correct source locations |
| Weeks 5–6 | R1 rule set | Approximately five rules with independent positive/negative/boundary evidence; no placeholders counted as completed rules |
| Weeks 7–8 | R1 calibration | Configuration, grouping, suppressions, and coverage reporting work; review representative findings with designers |
| Weeks 9–10 | R2 upload/report | HTTP/CLI parity; bounded jobs and tested data lifecycle; understandable failure states |
| Weeks 11–12 | R2 visual pilot | Correct highlight navigation, usable explanations, report export, and pilot observation |
| Weeks 13–16 | Reliability and release buffer | Resolve pilot blockers; document limits; release reproducibly; explore one contextual rule or revision/CI spike only if capacity remains |

Before releasing any rule: satisfy its acceptance tests, document thresholds and
exceptions, review its language, and verify it on real supported boards. Before
hosting: satisfy data-handling requirements. Before expanding scope: inspect pilot
noise and usefulness rather than adding rules to meet a count.

## 12. Current baseline, not completed product scope

As of September 9, 2026, the repository contains an experimental Python CLI, a
limited normalized model, one configurable trace-width rule, text/JSON output,
and eight passing local tests. It accepts one KiCad format version.

The initial experiment read 19 unrouted local templates and the routed StickHub
example. Native KiCad independently confirmed StickHub object counts and all 857
below-threshold findings' IDs, widths, start coordinates, nets, and layers at an
illustrative 0.20 mm threshold. That high count demonstrates the need for noise
management; it does not demonstrate 857 engineering errors.

Pads, outlines, courtyard geometry, connectivity, grouping, suppression, and the
web experience remain unimplemented. See [validation evidence](validation.md) for
the precise test scope and limitations. R0 evidence does not imply R1 acceptance.

## 13. Risks and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Accurate but noisy checks | Users stop reading reports | Group evidence, tune configuration, collect intentional exceptions, and remove low-value rules |
| Incomplete or incorrect geometry | Precise-looking misleading findings | Independent oracles, explicit geometry semantics, and skip unsupported cases |
| Electrical intent inferred from weak clues | Unjustified engineering advice | Keep initial checks geometric; require contextual evidence for later heuristics |
| Format/version drift | Silent data loss or broken imports | Supported-version matrix, pinned corpus, explicit rejection/coverage |
| Duplicating DRC without added value | Weak reason to adopt | Test educational clarity and review workflow; grow toward contextual review and revision awareness |
| Excess scope over 3–4 months | Many incomplete systems | Gate work by release; defer AI, history, integrations, and accounts |
| Proprietary design exposure | Loss of trust | Local-first engine, explicit upload policy, minimal retention, no implicit external AI use |
| Insufficient reviewer access | No reliable usefulness baseline | Recruit pilot participants early; separate synthetic correctness from user validation |

## 14. Open decisions and dependencies

| Decision | Working assumption | Needed by |
| --- | --- | --- |
| Weekly development capacity | Steady work across 12–16 weeks; hours unknown | First schedule review |
| Initial user/board focus | Beginner/intermediate KiCad designs; no unsupported electrical assumptions | Corpus selection |
| Additional KiCad versions | KiCad 9 format first | Before advertising broader compatibility |
| Rule threshold source | Explicit user configuration; no universal presets | R1 configuration design |
| Courtyard semantics | Explicit placement proxy for edge/spacing checks | Geometry implementation |
| Fifth rule | Via drill diameter replaces path analysis initially | R1 scope review |
| Pilot access and design permissions | 3–5 designers, 10–20 boards proposed | Calibration phase |
| Licensing and publication | Undecided; do not assume open-source license or hosted business model | Public release/third-party fixture redistribution |
| Hosted infrastructure and retention | Minimal anonymous pilot with temporary results | Before R2 implementation |

Justin is the product decision owner. These decisions should be resolved when they
affect the next milestone; they do not block continued local engine development.

## 15. Future product direction

After the core earns trust, expand toward possible decoupling relationships,
context-aware power/routing review, net inspection, revision comparison, and CI.
Revision review should show added, resolved, and changed findings with linked board
locations and explain changed measurements.

AI explanations and Q&A may consume structured evidence and user-provided context,
with explicit provenance and external-data disclosure. AI observations must remain
distinguishable from deterministic findings. Project history, collaboration, editor
plugins, additional formats, and commercial packaging follow demonstrated demand.
