# Elevation Award

A recognition-program web app: applicants submit projects, an admin manages the
evaluation panel and application pipeline, and evaluators score assigned entries.

Rebuilt as a React + TypeScript + Vite single-page app matching the router in
`src/App.tsx`, including the OAuth-style **post-login redirect** flow
(`PostLoginRedirect`): after a sign-in returns to `/`, the app forwards the user
to the path they were trying to reach (stored in `sessionStorage`).

## Stack

- **React 18** + **TypeScript** + **Vite**
- **wouter** for routing
- **Tailwind CSS** + shadcn/ui-style components (`src/components/ui`)
- **sonner** toasts, **Radix** primitives, **lucide-react** icons

## Data & auth

There is no backend yet. Two small, swappable modules stand in for one:

- `src/_core/store.ts` — a `localStorage`-backed data layer (applications,
  evaluators, scores) with a pub/sub so views stay in sync. Ships with seed
  data. Replace these functions with `fetch()` calls to wire up a real API.
- `src/_core/hooks/useAuth.tsx` — a standalone auth hook (no provider needed)
  that models an OAuth session. `login({ role, viaRedirect })` simulates the
  identity provider returning to `/`; swap it for real redirects later.

Demo sign-in requires no real account. Roles: `applicant`, `admin`,
`evaluator`. Pages gate themselves with `src/components/AuthGate.tsx`.

## Routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | Home | public |
| `/apply` | Application form | signed-in |
| `/apply/confirmation` | Submission confirmation | public |
| `/admin` | Dashboard | admin |
| `/admin/application/:id` | Application detail, scoring, status | admin |
| `/admin/evaluators` | Invite / manage panel | admin |
| `/evaluator/accept` | Accept panel invitation | public (via link) |
| `/evaluator` | Evaluator portal | evaluator/admin |
| `/evaluator/score/:id` | Score an application | evaluator/admin |

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Try the full loop

1. **Apply** at `/apply` (sign in as applicant) and submit a project.
2. Go to `/admin` (sign in as admin), open the application, and assign an
   evaluator on `/admin/evaluators`.
3. Copy an evaluator invite link, open `/evaluator/accept?email=…`, accept, and
   score the application from the evaluator portal.
4. Back in the admin detail view, see the score and mark the entry **awarded**.
