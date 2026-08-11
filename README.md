# RISEhigHER Elevation Award

A web app for the RISEhigHER Elevation Award: small-business owners submit an
application, an admin manages the pipeline and evaluation panel, and evaluators
score submissions on the official 100-point rubric.

**This app is fully self-contained — it depends on no external platform.** It
was migrated off Manus: sign-in, the database, and file storage all now run
inside the app itself. The only things it needs are Node.js and a folder to
write to.

## Stack

- **Frontend:** React 19 + Tailwind 4 + wouter + shadcn/ui, tRPC React Query.
- **Backend:** Express + tRPC 11.
- **Database:** SQLite (a single file), via Drizzle ORM + better-sqlite3.
- **Auth:** self-contained email + password sessions (scrypt-hashed, signed
  cookie). No third-party identity provider.
- **File storage:** local disk, served through an access-controlled route.

Everything the app persists lives in one folder (`DATA_DIR`, default `./data`):
`app.db` (the database) and `uploads/` (the documents). Back up that folder and
you've backed up the entire app.

## Quick start (local)

```bash
npm install
cp .env.example .env      # then edit SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev               # http://localhost:3000
```

On first boot the app creates its database and seeds the admin account from
`ADMIN_EMAIL` / `ADMIN_PASSWORD`. Sign in at `/login`.

Production build:

```bash
npm run build
npm start
```

## Environment

See `.env.example`. The important ones:

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Signs session cookies. Use a long random string. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin — seeded/promoted on every boot, so you can never get locked out. |
| `DATA_DIR` | Where `app.db` and `uploads/` live (default `./data`). |
| `PORT` | Listen port (default 3000). |
| `OWNER_NOTIFY_WEBHOOK` | Optional. POSTed a JSON alert when an application is submitted. |

## Roles & sign-in

- **Applicants** self-register at `/login` (email + password) and fill out their
  application.
- **Admin** is whoever matches `ADMIN_EMAIL`. To make someone else an admin,
  point `ADMIN_EMAIL` at them (or update the `role` column in `app.db`).
- **Evaluators** don't need accounts — the admin sends them a magic invite link
  (`/evaluator/accept?token=…`) which grants a scoped scoring session.

## Importing the legacy data

The 8 applications, budgets, settings, and 18 uploaded PDFs from the previous
host are imported with a one-time script. Point it at the extracted handoff
folder:

```bash
HANDOFF_DIR=/path/to/RISEhigHER_Elevation_Award_Complete_Handoff \
DATA_DIR=./data \
npx tsx tools/import-legacy-data.ts
```

It reconstructs the applicant accounts (without passwords — each person sets one
via the app; the `ADMIN_EMAIL` account gets its password from the env on boot),
preserves original IDs, and copies every PDF into `uploads/`. Re-run with
`FORCE=1` to wipe and re-import. **The imported data contains applicant PII — it
lives under `DATA_DIR`, which is git-ignored and must never be committed.**

## Deploying

Any host that runs a long-lived Node process works (Render, Railway, Fly.io, a
VPS). Two requirements:

1. Set the environment variables above.
2. Give `DATA_DIR` a **persistent disk** so the database and uploads survive
   restarts/redeploys.

Build with `npm run build`, run with `npm start`.

## Project layout

```
client/          React app (pages, components, contexts)
  src/pages/     Home, Login, Apply, Admin*, Evaluator*
server/
  routers.ts     tRPC procedures (auth, application, admin, evaluator, settings)
  db.ts          SQLite queries + schema bootstrap
  storage.ts     Local-disk file storage
  _core/         Session/auth, cookies, file route, server bootstrap
drizzle/schema.ts  Database schema (source of truth)
tools/           import-legacy-data.ts (one-time migration)
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Build client + bundle server |
| `npm start` | Run the production build |
| `npm run check` | TypeScript type-check |
| `npm test` | Run the test suite |
| `npm run db:push` | Push schema changes to the SQLite file (dev) |
