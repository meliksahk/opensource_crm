<div align="center">

# Awesome CRM (Open-Source CRM)

**An enterprise-grade, scalable, secure, role-based (RBAC) and multi-tenant, API-First open-source CRM.**

NestJS + PostgreSQL/Prisma backend · Next.js 14 (App Router) + Atomic Design frontend · Docker

A free, self-hosted CRM alternative built with NestJS and Next.js — leads & web-to-lead forms,
sales pipeline with a Kanban board, contacts & companies, quotes (CPQ) and invoicing, chart-rich
reports, signed webhooks, AI assistant, and multi-tenancy.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Backend](https://img.shields.io/badge/Backend-NestJS-e0234e.svg)](https://nestjs.com)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org)
[![DB](https://img.shields.io/badge/DB-PostgreSQL%20%2B%20Prisma-336791.svg)](https://www.prisma.io)
[![Tests](https://img.shields.io/badge/tests-106%20unit%20%2F%20108%20e2e-brightgreen.svg)](#tests--quality)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-d97757.svg)](https://claude.com/claude-code)

</div>

---

## Table of contents

- [What it offers](#what-it-offers)
- [Feature highlights](#feature-highlights)
- [Tech stack](#tech-stack)
- [Architecture & security principles](#architecture--security-principles)
- [Roles & permissions](#roles--permissions)
- [Modules & API surface](#modules--api-surface)
- [Roadmap](#roadmap)
- [Quick start](#quick-start)
- [Demo & test logins](#demo--test-logins)
- [Environment variables](#environment-variables)
- [Tests & quality](#tests--quality)
- [Project structure](#project-structure)
- [Known limitations (honest notes)](#known-limitations-honest-notes)
- [Built with Claude Code](#built-with-claude-code)
- [Contributing · License](#contributing)

---

## What it offers

Awesome CRM delivers an end-to-end CRM experience — from sales-pipeline
management to invoicing, from AI-assisted sales helpers to multi-tenant isolation.
All business logic is **API-First**; the Next.js panel consumes that API. Every
endpoint is **secure by default**, and authorization is verified on every request
from the live source through a two-layer **role + permission** model.

---

## Feature highlights

### 🔐 Authentication & authorization
- **JWT** (access + refresh) with refresh **rotation** + reuse/theft detection (any token reuse revokes all sessions).
- **bcrypt** password hashing; timing-attack and user-enumeration protection.
- **RBAC** in two layers: role (`@Roles`) + permission (`@Permissions`), AND logic. Permissions are read from the DB on every request (the token is never blindly trusted).
- IDOR/ownership checks; everything is protected except endpoints deliberately opened with `@Public()`.

### 📊 Sales (CRM core)
- **Pipeline + Kanban**: collision-free drag-and-drop via fractional ranking; atomic stage/order change (single transaction) + activity log.
- **Configurable stages**: add / rename / reorder / delete Kanban columns from the panel (`/pipeline`); Won/Lost flags; delete is guarded (last stage or stages referenced by deals are blocked).
- **Deal**: CRUD, ownership-based access, status (OPEN/WON/LOST), activities (NOTE/CALL/EMAIL/STAGE_CHANGE).
- **Lead (unqualified)**: status (`NEW`/`WORKING`/`QUALIFIED`/`UNQUALIFIED`) is set manually via the edit dialog; `CONVERTED` is set only by the convert flow. **Convert** opens a pre-filled deal dialog where you can optionally adjust title, value/currency, company, contact and target stage before turning the lead into Contact + Company + Deal.
- **Lead intake & source tracking**: every lead records a structured **channel** (`MANUAL` / `IMPORT` / `FORM` / `WEBHOOK` / `API`) alongside the free-text sub-source, and is filterable by channel/status/source.
  - **Embeddable form builder**: configure fields, button color & label, success message and redirect; embed on any external site via an `<iframe>` snippet. Submissions are unsigned/public and land as `FORM` leads (with custom fields captured into `meta`).
  - **Inbound lead webhook**: server-to-server endpoint per form; **HMAC-SHA256 signature is mandatory** (`x-crm-signature` / `x-crm-timestamp`) — an invalid or missing signature returns `401` with no DB write. Lands as a `WEBHOOK` lead.
- **Company / Contact**: related people/organization records.
- **Meeting**: calendar/meeting records (with date validation).

### 💰 Finance
- **Invoice** lifecycle: DRAFT → SENT → PARTIALLY_PAID → PAID / CANCELLED; immutability (only DRAFT is editable).
- All amounts are **Decimal** (no floats); server-side computation; overpayment guard.
- **Sequential, gap-free invoice numbers** (yearly atomic counter via `ON CONFLICT`).
- **Financial masking**: without the `invoice.read_financial` permission, amounts/line-items/payments are stripped at the API layer (SALES sees the invoice but not the figures).

### 🧾 Product & Quote (CPQ)
- **Product catalog** (unique SKU, Decimal price, soft delete).
- **Quote** lifecycle (DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED/CONVERTED); productId resolution, server-side Decimal totals.
- `send` → sequential quote number (QUO-year-seq); **`convert` → DRAFT Invoice** (single transaction, idempotent — double conversion blocked).

### 🤖 Artificial intelligence (Claude)
- Via the **Anthropic SDK** + `claude-opus-4-8` + structured outputs: **deal scoring** (0–100 + next steps), **follow-up email drafting**, **text summarization**.
- `ANTHROPIC_API_KEY` is **optional** — without it the endpoints return a graceful **503** and the app still boots (`/ai/status` lets the panel show/hide the feature).

### ⚙️ Automation & customization
- **No-code automation engine**: event triggers (record.created / stage.changed / field.updated) → actions (activity/email/log). Built on the existing event bus.
- **Low-code custom fields**: `CustomFieldDef` + `customFields` on records (Deal); TEXT/NUMBER/BOOLEAN/DATE/SELECT validation + required flag.

### 📈 Reporting
- Chart-rich dashboard (dependency-free SVG): **monthly revenue** (invoiced vs paid, financial-only), **won/lost trend** + win rate, **deal-status donut**, **sales by salesperson**, **top products** (by quoted revenue), and pipeline-by-stage.
- Pipeline value, period/status summaries, **weighted forecast** by stage probability, financial invoice summary (permission-gated).

### 🔗 Integration & data
- **Connections (panel-connectable integrations)**: connect external services from `/connections` — WhatsApp Business & Stripe (API key + test-ping), QuickBooks & Xero (**full OAuth2**: authorize redirect, state-validated callback, encrypted tokens with auto-refresh). Secrets are stored **AES-256-GCM encrypted** at rest (`APP_ENCRYPTION_KEY`) and never returned by the API.
- **WhatsApp Business (v3.1)**: send messages from leads/quotes/invoices, a chat-style **inbox** (`/whatsapp`) with lead/contact matching by phone, signed inbound webhook (Meta `X-Hub-Signature-256` mandatory), and a `send_whatsapp` **automation action** with `{{field}}` templating (e.g. auto-welcome on `lead.created`).
- **Accounting sync (v3.2)**: push issued invoices to QuickBooks Online or Xero with one click (`/accounting/invoices/:id/sync`) — sync state (SYNCED/FAILED + external id + attempts) tracked per invoice; retry by re-running.
- **Outbound webhooks**: subscribe to events (`deal.created/moved`, `invoice.issued/paid`) and manage them in-panel (`/integrations`) — create with a one-time signing secret, send a test event, inspect delivery history. HMAC-SHA256 signature, replay window, idempotency, SSRF protection; the panel documents how the receiver verifies the signature.
- **Email**: `simulated` and real `smtp` (nodemailer) drivers + template engine + EmailLog.
- **CSV import/export**: export contacts/companies/deals; import contacts/companies (**dedup** + per-row errors).
- **Duplicate detection + merge**: the source record's deals/contacts are moved to the target, then the source is deleted (single transaction).

### 🛡️ Platform maturity
- **Audit log**: every mutating request (actor/action/entity/status) is recorded append-only; admins can list it.
- **Global search**: across deal/contact/company, with results **filtered by permission**.
- **GDPR**: export a person's data (portability) + erase (right to be forgotten; deal links are detached).
- **PWA**: manifest + icon + theme.

### 🏢 Multi-tenancy
- Isolation via a **JWT tenant claim** — a tenant-bound user **cannot override their tenant** with an `x-tenant-id` header.
- A central Prisma `$use` layer **auto-injects/filters** `tenantId` on tenant-scoped models (eliminating the "forgot to scope = data leak" risk).
- `tenantId = null` → **platform admin** (cross-tenant); Tenant CRUD + user→tenant assignment.

### 🐳 DevOps
- Multi-stage **Docker** image (non-root user), `docker-compose` (DB internal-only, not exposed to host), health endpoint, fail-fast env validation (Joi).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS · PostgreSQL · Prisma (migration-based) · JWT · bcrypt · class-validator/transformer · Swagger · `@anthropic-ai/sdk` · nodemailer |
| **Frontend** | Next.js 14 (App Router) · TypeScript · Tailwind · Atomic Design · Axios + React Query |
| **DevOps** | Docker · docker-compose · Joi env validation |

---

## Architecture & security principles

- **API-First** + layered architecture: **`Controller → Service → Repository`**. No business logic in controllers; **`prisma.*` calls only in repositories**.
- **Secure by default**: global `JwtAuthGuard`; public endpoints are deliberately `@Public()`.
- **Time**: decision/business logic on server UTC; presentation in a separate tz layer.
- **Finance**: `Decimal` (no floats); invoice immutability; idempotency.
- **Webhooks**: no business/DB write happens before the HMAC signature is verified.
- **Secrets**: all secret values come from `.env`, never hardcoded; env schema is validated at startup with Joi (fail-fast). Passwords/tokens/PII are never logged.
- **Error responses**: global `AllExceptionsFilter`; no stack/SQL leakage in production. Standard envelope: `{ success, data, meta }` / `{ success, error }`.
- **Frontend Atomic Design**: atoms → molecules → organisms → templates → pages; a component imports only from lower levels.

---

## Roles & permissions

Permissions follow a `resource.action` shape (`deal.read`, `invoice.read_financial`, `ai.use`, `platform.tenant.manage`, …) and are defined centrally. Default role → permission mapping (least privilege):

| Role | Summary of access |
|------|-------------------|
| **ADMIN** | All permissions (including platform management) |
| **MANAGER** | Full Deal/Lead/Company/Contact/Meeting · integrations · automation · custom fields · product/quote · AI · data import/export/merge |
| **SALES** | Deal/Lead (own) · company/contact · product (read)/quote · AI · CSV export · **cannot see invoice amounts** (masked) |
| **FINANCE** | Full invoices + **financial read** · product (read)/quote (read + convert) |
| **VIEWER** | Read-only (except sensitive financial read) |

> The panel menu and buttons are shown/hidden by permission; the backend re-verifies authorization on every request.

---

## Modules & API surface

All endpoints are served under the `/api/v1` prefix (Swagger: `/api/docs`).

| Area | Main endpoints |
|------|----------------|
| **Auth** | `POST /auth/login` · `/auth/register` · `/auth/refresh` · `/auth/logout` |
| **Users/Roles** | `/users` · `/roles` (CRUD + role assignment) |
| **Deal/Kanban** | `/deals` · `/deals/board` · `PATCH /deals/:id/move` · `/deals/:id/activities` |
| **Pipeline/Stages** | `GET /pipelines` · `POST/PATCH/DELETE /pipelines/:id/stages[/:stageId]` · `PATCH .../stages/reorder` |
| **Lead** | `/leads` (filter `?channel=&status=&source=`) · `POST /leads/:id/convert` |
| **Lead forms** | `/lead-forms` (CRUD, `:id/secret`, `:id/rotate-secret`) · public: `GET /public/lead-forms/:publicKey`, `POST /public/lead-forms/:publicKey/submit`, `POST /webhooks/leads/:publicKey` (HMAC) |
| **Company / Contact** | `/companies` · `/contacts` |
| **Meeting** | `/meetings` |
| **Invoice** | `/invoices` · `POST /:id/issue` · `/:id/payments` · `/:id/cancel` |
| **Product / Quote** | `/products` · `/quotes` · `POST /quotes/:id/{send,accept,reject,convert}` |
| **AI** | `GET /ai/status` · `POST /ai/deals/:id/score` · `/ai/draft-email` · `/ai/summarize` |
| **Automation** | `/automation/rules` |
| **Custom fields** | `/custom-fields` |
| **Reports** | `/reports/{pipeline,deals/summary,forecast,invoices/summary}` · `revenue/monthly` · `sales/by-owner` · `products/top` · `deals/won-lost` |
| **Connections** | `GET /connections/catalog` · `GET/POST /connections` · `POST /connections/:id/test` · `PATCH/DELETE /connections/:id` · OAuth: `GET /connections/:id/oauth/start`, `GET /connections/oauth/callback` |
| **WhatsApp** | `GET /whatsapp/{status,conversations,thread/:phone}` · `POST /whatsapp/send` · public: `GET/POST /webhooks/whatsapp` (signed) |
| **Accounting** | `GET /accounting/invoices/:id` · `POST /accounting/invoices/:id/sync` |
| **Integrations** | `/integrations/webhooks` (+ inbound webhook HMAC verification) |
| **Data** | `GET /data/export/:entity` · `POST /data/import/:entity` · `/data/duplicates/:entity` · `/data/merge/:entity` |
| **Platform** | `/audit-logs` · `GET /search?q=` · `/gdpr/contacts/:id/{export,erase}` · `/tenants` (+ `:id/assign-user`) |
| **Health** | `GET /health` |

---

## Roadmap

### v1 — Core CRM (6 phases) ✅
| Phase | Scope |
|-------|-------|
| 1 | Core architecture + Prisma schema + JWT authentication |
| 2 | RBAC guards + user management |
| 3 | Lead/Deal + Kanban |
| 4 | Finance & invoicing (isolated permissions, masking) |
| 5 | External integrations (webhook, SMTP) |
| 6 | Dockerization + multi-tenancy foundation |

### v2 — Enterprise capabilities (V2.1–V2.10) ✅
| Sub-phase | Scope |
|-----------|-------|
| V2.1 | Company/Contact + Lead→Deal refactor + unqualified Lead/convert |
| V2.2 | Real SMTP + template engine + Meeting |
| V2.3 | No-code automation engine |
| V2.4 | Reporting & forecast |
| V2.5 | Low-code custom fields |
| V2.6 | **AI layer (Claude, key optional)** |
| V2.7 | **Product + Quote/CPQ → Invoice** |
| V2.8 | **CSV import/export + dedup/merge** |
| V2.9 | **Audit log + search + GDPR + PWA** |
| V2.10 | **Multi-tenancy completion (JWT tenant claim + platform admin)** |

---

## Quick start

**Requirements:** Node.js ≥ 20 · Docker + Docker Compose (local alternative: PostgreSQL ≥ 14).

### Option A — Full stack with Docker (production-like)

```bash
cp .env.example .env                  # root .env: fill in POSTGRES_* + JWT secrets
docker compose -p crm up -d --build   # db + backend(:3000) + frontend(:3001) + mailhog(:8025) + tunnel
# Backend applies migrations on startup. Panel: http://localhost:3001 · Health: /api/v1/health
docker compose -p crm exec backend npm run seed        # roles + permissions + admin + pipeline
docker compose -p crm exec backend npm run seed:demo   # role-based test users + sample data
# Shareable tunnel address (Cloudflare quick tunnel):
docker compose -p crm logs tunnel | grep trycloudflare
```

> All services run with `restart: unless-stopped` → they survive terminal/session
> shutdown. `frontend` proxies `/api` to `backend:3000` over the internal network
> (BACKEND_URL is baked in via a build arg). Because the tunnel is free, the address
> changes when the container restarts; use a named Cloudflare tunnel for a stable address.

### Option B — Backend locally, DB only in Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db

cd backend
cp .env.example .env            # DATABASE_URL → localhost:5432
npm install                     # Windows: see note (script-shell)
npx prisma migrate dev          # create the schema
npm run seed                    # roles + permissions + admin + pipeline
npm run start:dev               # http://localhost:3000  (Swagger: /api/docs)
```

> **Windows note:** in PowerShell some postinstall scripts fail due to `||`.
> Install with `npm install --script-shell "C:\\Windows\\System32\\cmd.exe"`.

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3001  (/api → proxied to backend)
```

> The frontend proxies `/api/*` to the backend **server-side** (single origin → no
> CORS/cookie issues, tunnel-friendly). The backend address is set via `BACKEND_URL`
> (default `http://localhost:3000`).

---

## Demo & test logins

```bash
cd backend && npm run seed && npm run seed:demo   # role-based users + sample data
```

| Role | Email | Password |
|------|-------|----------|
| ADMIN | `admin@crm.dev` | `ChangeMe!2026` |
| MANAGER | `manager@crm.dev` | `Demo!2026` |
| SALES | `sales@crm.dev` | `Demo!2026` |
| FINANCE | `finance@crm.dev` | `Demo!2026` |
| VIEWER | `viewer@crm.dev` | `Demo!2026` |

> Roles see different things: SALES cannot see invoice amounts (masked), FINANCE can;
> VIEWER is read-only; menu items are shown by permission.

---

## Environment variables

Key backend variables (`backend/.env.example`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection (required) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT secrets (must differ, required) |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Token lifetimes (default `15m` / `7d`) |
| `BCRYPT_COST` | bcrypt cost (10–15, default 12) |
| `CORS_ORIGINS` · `COOKIE_SECURE` | CORS/cookie settings |
| `THROTTLE_TTL` · `THROTTLE_LIMIT` | Rate limiting |
| `MAIL_DRIVER` | `simulated` \| `smtp` · `SMTP_*` (when smtp) |
| `WEBHOOK_ALLOW_PRIVATE` · `INBOUND_WEBHOOK_SECRET` | Webhook settings |
| `ANTHROPIC_API_KEY` | **Optional** — without it AI endpoints return 503 |
| `AI_MODEL` | AI model (default `claude-opus-4-8`) |

---

## Tests & quality

```bash
cd backend
npm run lint        # ESLint (0 warnings)
npm run build       # production build
npm run test        # 106 unit tests
npm run test:e2e    # 108 E2E tests (real PostgreSQL)
npm run test:cov    # coverage
```

**Status:** 106 unit + 108 E2E green · lint/build clean. **Negative tests are first-class**:
IDOR, privilege escalation, enumeration, cross-tenant access blocking, financial masking,
invoice immutability, double-conversion blocking, dedup, and AI no-key 503 scenarios.

---

## Project structure

```
.
├── backend/                # NestJS API
│   ├── prisma/             # schema + migrations + seed/seed-demo
│   └── src/
│       ├── common/         # guards, interceptors, filters, decorators, tenant ALS
│       ├── config/         # Joi env validation
│       └── modules/        # auth, users, roles, deals, leads, companies,
│                           # contacts, meetings, invoices, products, quotes,
│                           # ai, automation, custom-fields, reports,
│                           # integrations, data, audit, search, gdpr, tenants
└── frontend/               # Next.js 14 (App Router, Atomic Design)
    ├── app/(dashboard)/    # pages: deals, leads, companies, contacts,
    │                       # invoices, products, quotes, reports, ai, data,
    │                       # search, audit, roles, custom-fields, automation,
    │                       # tenants, users
    └── src/components/     # atoms → molecules → organisms → templates
```

---

## Known limitations (honest notes)

For transparency, parts intentionally left incomplete/staged:

- **In-app notifications** not built — needs an event-bus + user-targeting design; deferred to a separate sub-phase.
- **Multi-tenancy:** an **application-layer** Prisma `$use` tenant filter is used instead of Postgres row-level security (RLS). **Subdomain** resolution is not done in the backend (tenant comes from the JWT claim). There is **no per-tenant number uniqueness** (invoice/quote numbers are globally unique).
- **Webhook retry**: `processDuePending()` is ready but no worker/cron is scheduled.

---

## Built with Claude Code

This project was designed and implemented with the help of
[**Claude Code**](https://claude.com/claude-code), Anthropic's agentic coding tool
(model: Claude Opus 4.8). Architecture decisions, the phased roadmap, the NestJS/Next.js
implementation, the test suite, and this documentation were produced in a
human-in-the-loop workflow.

Per Anthropic's recommended attribution, commits co-authored by the assistant carry a
trailer:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

The AI feature module (`backend/src/modules/ai`) also calls the Claude API at runtime
via the Anthropic SDK — but that is optional and unrelated to how the code was authored
(see [Artificial intelligence (Claude)](#-artificial-intelligence-claude)).

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Every PR must keep
lint + unit + integration + security (negative) tests green; no architectural violations
(Prisma only in repositories; Atomic layers on the frontend).

## License

[MIT](./LICENSE)
