# FRQ grading proxy (future — not implemented)

The site ships with **no** AI grading. FRQ practice runs in **self-check** mode:
"Check my work" reveals the model answer for each part and lets the student
self-assess (Got it / Partially / Missed) for a local score.

To enable real AI feedback later, stand up a small serverless proxy (e.g. a
Cloudflare Worker) that holds your Anthropic API key **server-side** — the key
must never reach the browser. Then set the provider once, in the header snippet,
after the bundle loads:

```html
<script>
  window.addEventListener('DOMContentLoaded', function () {
    window.PS.grading.provider = { endpoint: 'https://your-worker.example.workers.dev/grade' };
  });
</script>
```

No other file changes — `frq.js` already renders whatever `grade()` returns.

## Endpoint contract

**Request** — `POST {endpoint}`, `Content-Type: application/json`:

```json
{
  "question": { "id": "frq-1", "unit": "Kinematics", "title": "…",
                "scenario": "…", "parts": [{ "label": "Part (a)", "text": "…",
                "modelAnswer": "…", "points": 3 }] },
  "answers": { "Part (a)": "student text", "Part (b)": "student text" }
}
```

**Response** — `200`, `Content-Type: application/json`, matching the shape the
FRQ UI already consumes:

```json
{
  "mode": "graded",
  "score": 6,
  "max": 8,
  "parts": [
    { "label": "Part (a)", "score": 3, "max": 3, "feedback": "Correct — …" },
    { "label": "Part (b)", "score": 3, "max": 5, "feedback": "Partial — …" }
  ]
}
```

- `parts[i]` must align by index with the question's parts.
- On any error, return a non-2xx status; the UI falls back to a friendly message.

## What the Worker should do

1. Read `{ question, answers }` from the request body.
2. Build a grading prompt (rubric from `parts[].modelAnswer` and `points`).
3. Call the Anthropic Messages API with your key from an environment secret.
4. Parse the model's reply into the response shape above and return it.
5. Restrict CORS to `https://physicssolved.com` and rate-limit by IP.

Keep the key in a Worker secret (`wrangler secret put ANTHROPIC_API_KEY`), never
in this repo or the client bundle.
