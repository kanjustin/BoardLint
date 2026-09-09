# Getting a PCB reviewed with BoardLint

## Which file do I need?

BoardLint initially reviews **PCB layouts**, supplied as `.kicad_pcb` files.
A KiCad schematic (`.kicad_sch`) describes the circuit. The board layout contains
the placement and routing geometry needed for the initial checks. A screenshot,
PDF schematic, Gerber export or project ZIP is not a supported initial input.

If you already have a laid-out board, save it in KiCad and use that board file
directly. You do not need to export an image or convert the file for BoardLint.
Currently the prototype accepts KiCad 9 board format `20241229` only. Broader
version support and combined schematic/layout analysis are future work.

## Prepare your board in KiCad

1. Create or open your circuit schematic and assign footprints to its components.
2. Open the PCB Editor and use **Tools → Update PCB from Schematic** (`F8`) to
   transfer the footprints and connection information.
3. Lay out the board: place components, define its outline and route connections.
4. Save the resulting `.kicad_pcb` file. Use KiCad's own electrical/design-rule
   checks as part of your normal design process; BoardLint adds review feedback.

KiCad documents this transfer in its [PCB Editor guide](https://docs.kicad.org/9.0/en/pcbnew/pcbnew.html).
Transferring the schematic does not automatically produce a finished board layout.
An unfinished board can be reviewed, but conclusions apply only to present data;
an unrouted board has no routed trace widths to assess.

## Review it today: local CLI

From the BoardLint repository, run:

```sh
python3 -m boardlint "/path/to/your-board.kicad_pcb" --min-trace-width 0.2
```

Choose a review threshold appropriate to the project. The example `0.2` is not a
universal minimum. For a shareable machine-readable report:

```sh
python3 -m boardlint "/path/to/your-board.kicad_pcb" --min-trace-width 0.2 --format json > review.json
```

The prototype checks stored widths of segments and arcs. Its report includes:

- Board object counts and analysis coverage limitations.
- Affected track ID, net, layer and start coordinates.
- Measured width and your configured threshold.
- Why the condition was flagged and what to consider next.

Locate the referenced area in KiCad, inspect the design context, make any changes
you decide are appropriate, save, and rerun. The CLI leaves the input unchanged
and processes it locally. No account, upload or AI provider is involved.

There is no interactive viewer, automatic fix, or revision comparison yet.
No findings means only that this check found no below-threshold routed widths.
If a schematic is selected, BoardLint explains that it needs the PCB layout file.

## Review in the browser: early implementation

The initial website now provides file drop/selection, a review threshold, real
analysis, paginated findings with source locations, and JSON download. Choose
your file and click **Review board**, or select **Try the example board** first.
Processing happens in your browser; your PCB is not uploaded or retained on a
server. The first run downloads the engine, so it can take a moment to start.
You can cancel an active review. The current check still covers trace widths only.

## Full visual review experience: planned

```text
Save PCB layout in KiCad
          ↓
Select .kicad_pcb in BoardLint
          ↓
Review settings and start analysis
          ↓
See findings and which checks could run
          ↓
Select a finding to highlight the affected board area
          ↓
Read evidence, explanation and possible action
          ↓
Revise in KiCad, save and review again
```

The planned web pilot accepts a single board file without requiring an account.
It will disclose upload handling before analysis, validate the file, execute the
same engine as the CLI, and show an issue list alongside a basic board viewer.
Users will be able to filter findings, inspect measurements, record intentional
exceptions and download a report. Unsupported geometry will appear as incomplete
coverage rather than a successful check.

Changes remain the user's decision and are made in KiCad. Automatic new/resolved
issue comparison and schematic-aware advice come after the initial release.
