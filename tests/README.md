# Golden Tests

## Structure

```
tests/
├── input/          → Mermaid source files (.mmd)
├── expected/       → Expected .excalidraw output (golden)
└── run_golden.sh   → Test runner
```

## Usage

```bash
# Run all golden tests
bash tests/run_golden.sh

# Add a new golden test
cp new_diagram.mmd tests/input/
npx tsx scripts/render.ts -i tests/input/new_diagram.mmd -o tests/expected/new_diagram.excalidraw
```

## What Gets Tested

Each input .mmd is rendered through the full pipeline:

1. Mermaid parse → dagre layout
2. Style normalization
3. Theme application
4. Excalidraw JSON output

The output is compared byte-for-byte against the expected golden file. If any regression
occurs in the pipeline, the test fails.

## When to Regenerate Expected

Regenerate `tests/expected/` when you **intentionally** change output behavior:

```bash
bash tests/run_golden.sh --regenerate
```

Never regenerate expected files as a way to "fix" a test failure — that hides regressions.
