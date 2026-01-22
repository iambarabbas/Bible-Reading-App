# Bible Reading Plan (Simple Static App)

Overview
- Small static app to track completion of a 5-day-per-week Bible reading plan.

Files added
- **index.html**: main UI
- **style.css**: styles
- **app.js**: client logic and localStorage persistence
- **plan.json**: sample reading plan (edit to match your plan)

Run locally
1. Recommended: serve over a simple local HTTP server to allow `fetch` to load `plan.json`.

```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

Editing your plan
- Update `plan.json` with your weeks and 5-day arrays. Keep the structure:

```json
{
  "weeks": [
    {"name":"Week 1","days":["Reading A","Reading B","Reading C","Reading D","Reading E"]}
  ]
}
```

Next steps I can help with
- Import your attached plan into `plan.json`.
- Add week jump selector, print/export, or sync to cloud storage.
