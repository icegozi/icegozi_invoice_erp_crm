# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Invoice is an open-source ERP/CRM (Invoice / Quote / Payment / Accounting) built on the MERN stack: Node.js/Express + MongoDB (Mongoose) backend, React + Vite + Ant Design + Redux frontend. Node 20.9.0 / npm 10.2.4 are required (enforced in `package.json` engines; `server.js` exits if Node < 20).

The repo is two independent npm packages: `backend/` and `frontend/`. There is no root-level package.json — run commands inside each directory.

## Commands

### Backend (`cd backend`)

- `npm run dev` — start with nodemon (hot reload, ignores `public/`)
- `npm start` — start without reload (`node src/server.js`)
- `npm run setup` — **required before first run.** Seeds the initial admin (`admin@admin.com` / `admin123`) and default settings into MongoDB. Re-running creates duplicate data.
- `npm run reset` — wipe collections
- `npm run upgrade` — run upgrade/migration script
- Server listens on `PORT` env (default **8000**).

### Frontend (`cd frontend`)

- `npm run dev` — Vite dev server on port **3000**, proxies `/api` → `http://localhost:8000/`
- `npm run dev:remote` — dev against a remote backend (`VITE_BACKEND_SERVER`)
- `npm run build` — production build
- `npm run lint` — ESLint (`--max-warnings 0`; lint must be clean)
- No test suite is configured in either package.

### Environment

Backend reads `.env` then `.env.local` (both loaded; local overrides). Required: `DATABASE` (MongoDB URI). Also used: `JWT_SECRET`, `OPENAI_API_KEY`, `RESEND_API` (email), AWS S3 vars. Frontend uses `VITE_BACKEND_SERVER`, `VITE_FILE_BASE_URL`, `VITE_DEV_REMOTE`.

## Architecture

### The central pattern: models drive everything (backend)

Adding a Mongoose model file to `backend/src/models/appModels/` automatically creates a full REST API for it — **no manual controller or route wiring needed.** This is the most important concept in the codebase:

1. `src/models/utils/index.js` globs `appModels/*.js` at boot and derives, for each model: the entity name (lowercase), model name (PascalCase), and controller name (`<camelCase>Controller`). It exports `routesList`, `entityList`, etc.
2. `src/controllers/appControllers/index.js` builds a controller per model. If a folder exists under `appControllers/<name>Controller/`, that **custom** controller is used; otherwise a generic CRUD controller is generated via `createCRUDController(modelName)`.
3. `src/routes/appRoutes/appApi.js` iterates `routesList` and mounts standard routes for every entity: `create`, `read/:id`, `update/:id`, `delete/:id`, `search`, `list`, `listAll`, `filter`, `summary`. Special routes are added conditionally (e.g. `mail` for invoice/quote/payment, `convert/:id` for quote).

`createCRUDController` (`src/controllers/middlewaresControllers/createCRUDController/`) provides the generic handlers as separate files (`create.js`, `paginatedList.js`, `read.js`, etc.). To **customize** behavior for an entity, create `appControllers/<entity>Controller/index.js` that calls `createCRUDController(ModelName)` and overrides/adds methods (see `clientController` for the minimal pattern, `invoiceController`/`paymentController` for heavier customization).

### Core vs App split

- **coreModels / coreControllers / coreRoutes** — framework-level concerns that are NOT auto-generated: `Admin`, `AdminPassword`, `Setting`, `Upload`. Hand-wired routes in `coreApi.js` (admin profile, settings) and `coreAuth.js` (login, logout, forget/reset password).
- **appModels / appControllers** — business entities (`Client`, `Invoice`, `Payment`) that flow through the auto-generation pattern above.

### Express app wiring (`src/app.js`)

Route mounting order matters:

- `/api` + `coreAuthRouter` — public auth (no token)
- `/api` + `adminAuth.isValidAuthToken` + `coreApiRouter` — authenticated core
- `/api` + `adminAuth.isValidAuthToken` + `erpApiRouter` — authenticated app entities
- `/download`, `/public` — file serving

Auth is JWT via `adminAuth.isValidAuthToken` middleware; the token header is `x-auth-token`. Errors are wrapped with `catchErrors()` from `src/handlers/errorHandlers.js` and surfaced by `notFound` / `productionErrors`.

### Frontend structure (`frontend/src`)

- `request/` — axios wrapper (`request.js`) that mirrors the backend CRUD verbs (`create`, `read`, `update`, `list`, `search`, `filter`, …). Attaches the bearer token from persisted Redux state and runs `successHandler`/`errorHandler` for notifications. Base URL from `config/serverApiConfig.js`.
- `redux/` — Redux Toolkit store with slices: `auth`, `crud`, `adavancedCrud`, `erp`, `settings`. The generic `crud` slice powers list/read/create/update for any entity.
- `modules/` — feature logic. `CrudModule` and `ErpPanelModule` are generic, entity-agnostic building blocks; `InvoiceModule`, `QuoteModule`, `PaymentModule`, etc. compose them with entity-specific config.
- `pages/` — route screens; `router/` (`AppRouter`, `AuthRouter`, `routes.jsx`) maps them.
- `context/` — per-feature React context (`crud`, `erp`, `appContext`, `profileContext`) used alongside Redux.
- `forms/` — shared dynamic form configs; `locale/` — i18n.
- Path alias `@` → `src` (configured in `vite.config.js`, mirrors backend's `@` → `src` via `module-alias`).

### Adding a new business entity (end-to-end)

1. Backend: add `models/appModels/Foo.js` (Mongoose schema). REST API appears automatically.
2. Backend (optional): add `controllers/appControllers/fooController/` to override CRUD behavior.
3. Frontend: add a page + route, and use `request`/`crud` redux with `entity: 'foo'` — no new API client code needed.

## Conventions

- Both packages use the `@` alias for `src`. Backend uses CommonJS (`require`); frontend uses ESM (`"type": "module"`).
- Models are loaded eagerly at server boot (globbed in `server.js`) so `mongoose.model('Name')` works anywhere afterward.
- Prettier is configured in the frontend; keep `npm run lint` at zero warnings.
- License: GNU AGPL v3.0 / Fair-code.
