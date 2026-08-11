# Deploying the Elevation Award app

Recommended host: **Render** (Starter plan + a 1 GB persistent disk). Roughly
**$8/month**. A `render.yaml` blueprint is included so most of this is
automatic.

## 1. Deploy

1. Create a free account at [render.com](https://render.com) and connect your
   GitHub account.
2. In Render: **New +** → **Blueprint** → pick the `elevationaward` repo.
   Render reads `render.yaml` and sets up the web service + persistent disk.
3. When prompted, enter two values:
   - **ADMIN_EMAIL** — the email you'll sign in with as admin.
   - **ADMIN_PASSWORD** — a strong password.
   (`SESSION_SECRET` is generated for you automatically.)
4. Click **Apply**. First build takes a few minutes. When it's live, visit the
   URL Render gives you and sign in at `/login`.

That's it — every time changes are pushed to the repo, Render redeploys.

## 2. Custom domain (risehigheraward.com)

In the service's **Settings → Custom Domains**, add your domain and follow
Render's DNS instructions. SSL is automatic and free.

## 3. Load your existing data

Your 8 applications and 18 documents are imported once with
`tools/import-legacy-data.ts` (see the README). Getting the handoff files onto
the server is a one-time step — the simplest path is to run the import against a
local `DATA_DIR`, then upload that `data/` folder to the Render disk. **I can do
this with you when you're ready** — it needs the handoff archive and a couple of
Render Shell commands.

## 4. Back up your data (important)

Everything lives in the `/data` disk. Render keeps that disk across restarts,
but it is **not** an off-site backup. Periodically save a copy:

- In Render, open the service's **Shell** and run:
  ```bash
  DATA_DIR=/data ./tools/backup-data.sh
  ```
  Then download the archive it creates from `backups/`.
- Do this after each application cycle, and any time before a big change.

A backup is a single `.tar.gz` of the database + documents; to restore, unpack
it into `DATA_DIR`.

## Alternatives (if you ever want them)

- **Railway** — very similar to Render, usage-based pricing. Add a volume
  mounted where `DATA_DIR` points.
- **Fly.io** — cheap, a bit more technical; uses volumes.
- **A VPS** (DigitalOcean, Hetzner) — cheapest and most control, but you manage
  the server. Overkill at this scale.

Vercel/Netlify are **not** suitable — they can't hold the SQLite database file.
