/**
 * Hono + HTMX educational example
 *
 * Run: npm install && npm run dev
 * Open: http://localhost:3000
 *
 * HTMX lets the browser swap HTML fragments returned by the server —
 * no client-side JavaScript framework needed.
 */

import { serve } from '@hono/node-server'
import { Hono } from 'hono'

// Create the Hono app — think of it as a tiny Express-like router.
const app = new Hono()

// Simple server-side state for the toggle demo (resets when you restart).
let toggleOn = false
let visitCount = 0

// ---------------------------------------------------------------------------
// Route: GET /  —  serve the full HTML page (only loaded once on first visit)
// ---------------------------------------------------------------------------
app.get('/', (c) => {
  visitCount++

  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hono + HTMX Example</title>

  <!-- HTMX: add attributes like hx-post, hx-get, hx-target to plain HTML -->
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>

  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, sans-serif;
      max-width: 32rem;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.5;
      color: #1a1a1a;
    }
    h1 { font-size: 1.5rem; }
    section {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }
    h2 { font-size: 1rem; margin-top: 0; }
    label { display: block; margin-bottom: 0.25rem; font-weight: 600; }
    input[type="text"] {
      width: 100%;
      padding: 0.5rem;
      margin-bottom: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background: #2563eb;
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    button:hover { background: #1d4ed8; }
    .result {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f0f9ff;
      border-radius: 4px;
      min-height: 2.5rem;
    }
    .muted { color: #666; font-size: 0.85rem; }
    .on  { background: #dcfce7; }
    .off { background: #fef3c7; }
  </style>
</head>
<body>
  <h1>Hono + HTMX</h1>
  <p class="muted">
    The page is plain HTML. HTMX sends requests to Hono and swaps in the HTML
    fragments the server returns — no React, no build step for the frontend.
  </p>

  <p class="muted">
    Full code at: <a href="https://github.com/ajerni/hono" target="_blank">https://github.com/ajerni/hono</a>
  </p>
  
  <!-- ── Demo 1: Greet by name ─────────────────────────────────────────── -->
  <section>
    <h2>1. Greet me</h2>
    <p class="muted">Type your name and submit. Hono reads the form and sends back a greeting.</p>

    <!--
      hx-post="/greet"     → POST to our Hono route (not a full page reload)
      hx-target="#greeting" → put the response HTML inside this element
      hx-swap="innerHTML"   → replace the inside of #greeting (default behaviour)
    -->
    <form
      hx-post="/greet"
      hx-target="#greeting"
      hx-swap="innerHTML"
    >
      <label for="name">Your name</label>
      <input id="name" name="name" type="text" placeholder="e.g. Alex" required />
      <button type="submit">Say hello</button>
    </form>

    <!-- Empty at first; filled by the server after each submit -->
    <div id="greeting" class="result muted">Your greeting will appear here…</div>
  </section>

  <!-- ── Demo 2: Button changes page via server ──────────────────────────── -->
  <section>
    <h2>2. Toggle status</h2>
    <p class="muted">
      Click the button. Hono flips server state and returns a new HTML snippet.
    </p>

    <!--
      hx-post="/toggle"      → ask the server to toggle state
      hx-target="#status-box" → update only this box, rest of page stays put
    -->
    <button
      hx-post="/toggle"
      hx-target="#status-box"
      hx-swap="outerHTML"
    >
      Toggle server state
    </button>

    <!--
      Initial content is also rendered by Hono (visit count on first load).
      After toggling, the whole #status-box element gets replaced.
    -->
    <div id="status-box" class="result off" style="margin-top: 1rem;">
      <strong>Status:</strong> OFF<br />
      <span class="muted">Page loads so far: ${visitCount}</span>
    </div>
  </section>

  <!-- ── Demo 3: Live clock fragment (GET, no form) ─────────────────────── -->
  <section>
    <h2>3. Refresh time</h2>
    <p class="muted">A simple GET request — useful for “load partial content” patterns.</p>

    <button
      hx-get="/time"
      hx-target="#clock"
      hx-swap="innerHTML"
    >
      What time is it on the server?
    </button>

    <div id="clock" class="result muted" style="margin-top: 1rem;">Click the button…</div>
  </section>
</body>
</html>
  `)
})

// ---------------------------------------------------------------------------
// Route: POST /greet  —  return an HTML fragment (not a full page)
// ---------------------------------------------------------------------------
app.post('/greet', async (c) => {
  // parseBody() reads form fields from the POST body (Content-Type: application/x-www-form-urlencoded)
  const body = await c.req.parseBody()
  const name = String(body['name'] ?? '').trim()

  if (!name) {
    // HTMX still swaps this into #greeting — same pattern, different message
    return c.html('<p class="muted">Please enter a name.</p>')
  }

  // Return only the snippet HTMX will inject — no &lt;html&gt; wrapper needed
  return c.html(`<p>Hello, <strong>${escapeHtml(name)}</strong>! 👋</p>`)
})

// ---------------------------------------------------------------------------
// Route: POST /toggle  —  server changes state, returns updated HTML box
// ---------------------------------------------------------------------------
app.post('/toggle', (c) => {
  toggleOn = !toggleOn

  const cssClass = toggleOn ? 'on' : 'off'
  const label = toggleOn ? 'ON' : 'OFF'
  const emoji = toggleOn ? '✅' : '⏸️'

  // outerHTML swap replaces the entire #status-box element, so we repeat its id
  return c.html(`
    <div id="status-box" class="result ${cssClass}" style="margin-top: 1rem;">
      <strong>Status:</strong> ${label} ${emoji}<br />
      <span class="muted">Toggled on the server — no full page reload.</span>
    </div>
  `)
})

// ---------------------------------------------------------------------------
// Route: GET /time  —  another small HTML fragment
// ---------------------------------------------------------------------------
app.get('/time', (c) => {
  const now = new Date().toLocaleString()
  return c.html(`<p>Server time: <strong>${escapeHtml(now)}</strong></p>`)
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape user input so we don't accidentally inject HTML when greeting. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Start the Node.js HTTP server
// ---------------------------------------------------------------------------
// PORT is set by Docker / docker-compose; defaults to 3000 for local dev.
const port = Number(process.env.PORT) || 3000
console.log(`→ http://localhost:${port}`)

serve({ fetch: app.fetch, port })
