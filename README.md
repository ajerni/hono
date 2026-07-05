# Hono + HTMX Example

A small educational demo showing how [Hono](https://hono.dev) serves HTML fragments to a plain HTML frontend powered by [HTMX](https://htmx.org) — no React, no client-side framework.

## What it demonstrates

- **Greet by name** — form submits to the server, greeting appears without a page reload
- **Toggle status** — button flips server-side state and swaps in new HTML
- **Server time** — simple GET request returning a partial update

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
PORT=3001 npm start
```

## Docker

```bash
docker compose up -d --build
```

The app listens on port **3001** inside the container. Direct access on the host: [http://localhost:8089](http://localhost:8089).

With Traefik configured (see `docker-compose.yml`), the app is served at `hono.wineagent.com` over HTTPS.

## Project structure

```
src/index.ts   — Hono routes and HTML (with inline comments)
Dockerfile     — multi-stage build (TypeScript → Node)
```
