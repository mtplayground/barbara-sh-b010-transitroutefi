# Find the Best Public Transit Route

A full-stack TypeScript app for comparing public transit routes. The frontend is
React, Vite, Tailwind, React Query, and i18next. The backend is Node, Express,
Zod, and provider-based route lookup. When no Google server key is configured,
the backend uses deterministic Metro Vancouver mock routes so local development
and E2E tests work without external services.

## Repository Layout

```text
apps/frontend/      React + TypeScript + Vite app
apps/backend/       Express + TypeScript API and production static server
packages/shared/    Shared route, provider, and API TypeScript types
tests/e2e/          Playwright browser tests
```

## Requirements

- Node.js 20 or newer
- npm
- Optional Google Cloud project with Directions API and Maps JavaScript API
  enabled

## Setup

```bash
npm install
cp .env.example .env
```

For Playwright E2E tests, install the browser runtime once:

```bash
npx playwright install chromium
```

## Environment Variables

The app reads environment values from `.env` at the repository root.

```bash
NODE_ENV=development
HOST=0.0.0.0
PORT=8080
GOOGLE_MAPS_SERVER_KEY=your_google_maps_server_key_here
VITE_GOOGLE_MAPS_BROWSER_KEY=your_google_maps_browser_key_here
GOOGLE_DIRECTIONS_LANGUAGE=en
GOOGLE_DIRECTIONS_REGION=ca
```

`GOOGLE_MAPS_SERVER_KEY` is used only by the backend for Google Directions API
transit searches. If it is blank or missing, the backend automatically uses the
mock provider.

`VITE_GOOGLE_MAPS_BROWSER_KEY` is exposed to the frontend by Vite and is used
only for the optional map view. Route searches never call Google directly from
the browser.

## Development

Run backend and frontend together:

```bash
npm run dev
```

The frontend runs on `http://127.0.0.1:5173` and proxies `/api` to the backend on
`http://127.0.0.1:8080`.

Targeted development commands:

```bash
npm run dev:backend
npm run dev:frontend
```

## Testing and Quality

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

`npm run test:e2e` starts the app with `GOOGLE_MAPS_SERVER_KEY` unset so the mock
provider is used. The E2E suite covers entering a start and destination,
searching routes, displaying ranked options, expanding steps and fare, and
swapping start/destination.

## Production Build

```bash
npm run build
NODE_ENV=production HOST=0.0.0.0 PORT=8080 npm start
```

The production backend serves:

- API routes under `/api`
- the built frontend from `apps/frontend/dist`
- the SPA shell for non-API browser routes

Health check:

```bash
curl http://127.0.0.1:8080/api/health
```

## Self-Hosted Deploy

1. Provision a host with Node.js 20 or newer.
2. Clone the repository and run `npm ci`.
3. Create `.env` from `.env.example`.
4. Set `GOOGLE_MAPS_SERVER_KEY` for live Google Directions API routing, or leave
   it blank to use mock routes.
5. Set `VITE_GOOGLE_MAPS_BROWSER_KEY` before `npm run build` if the deployed map
   view should load Google Maps.
6. Run `npm run build`.
7. Start the app with `NODE_ENV=production HOST=0.0.0.0 PORT=8080 npm start`.
8. Put a reverse proxy, load balancer, or process manager in front of port 8080
   as needed for TLS and restarts.

Only `PORT`, `HOST`, `NODE_ENV`, Google keys, and Google Directions locale
variables are required for this app. No database is required.
