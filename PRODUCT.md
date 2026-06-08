# Find the Best Public Transit Route

## What It Is

Find the Best Public Transit Route is a full-stack TypeScript web app for
planning and comparing public transit routes. It lets a user enter a starting
point, destination, and travel-time preference, then returns ranked route
options with instructions, fare information, and optional map display.

## Current Capabilities

- Search form for starting point, destination, and time mode: leave now, depart
  at, or arrive by.
- Start/destination swap control.
- Backend `POST /api/routes` endpoint with Zod validation, normalized responses,
  ranked route results, friendly validation errors, and a distinct no-route
  result.
- Route ranking by shortest total duration, then fewer transfers, less walking,
  and earlier arrival.
- Provider selection that uses Google Directions transit mode when
  `GOOGLE_MAPS_SERVER_KEY` is configured and deterministic Metro Vancouver mock
  routes otherwise.
- Results list with best-route highlight, alternative cards, transit lines,
  duration, departure/arrival times, transfers, walking time, expandable
  step-by-step instructions, and estimated fare when available.
- Optional Google Maps JavaScript map rendering with route path, start/end
  markers, and transit stops when browser key and map data are available.
- English and Simplified Chinese UI via `react-i18next`, including a persisted
  header language toggle.
- Recent successful searches persisted in `localStorage` for one-tap reuse.
- Trust disclaimer near results: transit times and fares are estimates and
  should be confirmed with the official transit provider.
- Playwright E2E coverage for the five core flows and Vitest coverage for
  backend routing, provider selection, static serving, and route ranking.

## Architecture

- npm workspaces:
  - `apps/frontend`: React, TypeScript, Vite, Tailwind, React Query, i18next.
  - `apps/backend`: Node, Express, TypeScript, Zod, provider-based routing.
  - `packages/shared`: shared TypeScript route, provider, and API contracts.
- The browser calls only the backend API. Google Directions requests happen only
  server-side.
- Routing providers implement a common `RoutingProvider` interface returning
  normalized `RouteOption[]`.
- The mock provider is the default local/dev fallback, so the app and tests run
  without Google credentials.
- Production `npm start` runs the compiled backend, serves API routes under
  `/api`, serves the Vite frontend build from `apps/frontend/dist`, and returns
  the SPA shell for non-API browser routes.

## Conventions

- Runtime configuration comes from root `.env` / environment variables; secrets
  are not committed.
- Use `GOOGLE_MAPS_SERVER_KEY` for backend Google Directions calls and
  `VITE_GOOGLE_MAPS_BROWSER_KEY` for the frontend map view.
- Keep shared data contracts in `packages/shared` and provider-specific parsing
  inside provider implementations.
- Keep ranking pure and provider-agnostic.
- Keep API paths under `/api` so they do not collide with the frontend SPA
  fallback.
- Validate with `npm run format:check`, `npm run lint`, `npm run typecheck`,
  `npm run test`, `npm run test:e2e`, and `npm run build`.
