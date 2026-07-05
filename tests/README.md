# Golden Tests

## Structure

```
tests/
├── input/          → JS scripts (.js) and JSON descriptors (.json)
├── expected/       → Expected .excalidraw output (golden)
└── run_golden.sh   → Test runner
```

## Usage

```bash
# Build first
npm run build

# Run all golden tests
bash tests/run_golden.sh
```

## Adding Tests

### JS Script (Diagram API)

Create `tests/input/my_diagram.js`:
```js
import { Diagram } from "../../dist/index.js";
const d = new Diagram("sketchy");
d.addBox("Start", { row: 0, col: 0 });
d.addBox("End", { row: 0, col: 2 });
d.addArrow("Start", "End");
export default d;
```

### JSON Descriptor (renderDiagram)

Create `tests/input/my_diagram.json`:
```json
{
  "type": "flowchart",
  "direction": "TB",
  "nodes": [
    { "id": "A", "label": "Start" },
    { "id": "B", "label": "End" }
  ],
  "edges": [
    { "from": "A", "to": "B" }
  ]
}
```

### Generating Expected Output

Run the test runner once — it auto-generates missing expected files:
```bash
bash tests/run_golden.sh
```

## What Gets Tested

- **JS tests:** Diagram API → elements → Excalidraw JSON
- **JSON tests:** descriptor → layout engine → render → Excalidraw JSON

The output is compared against the expected golden file after stripping
unpredictable fields (UUIDs, seeds).

## When to Regenerate Expected

Delete the expected file and re-run the test runner to regenerate:
```bash
rm tests/expected/my_diagram.excalidraw
bash tests/run_golden.sh
```

Never regenerate expected files as a way to "fix" a test failure — that hides regressions.
