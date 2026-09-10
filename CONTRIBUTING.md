# Contributing / Development Workflow

This project uses a lightweight **GitHub Flow**: every change happens on a
short-lived branch, is reviewed through a Pull Request (PR), previewed, and then
merged into `main`. Nothing is committed directly to `main`.

## The loop

### 1. Start from an up-to-date `main`

```bash
git checkout main
git pull
```

### 2. Create a branch

Use a descriptive, prefixed name:

```bash
git checkout -b feature/add-dark-mode
```

Common prefixes:

| Prefix      | Use for                                  |
| ----------- | ---------------------------------------- |
| `feature/`  | New functionality                        |
| `fix/`      | Bug fixes                                |
| `chore/`    | Tooling, deps, cleanup, docs             |
| `docs/`     | Documentation only                       |

### 3. Develop and test locally

```bash
npm install
npm run dev        # http://localhost:8080
```

The app talks to the Supabase project configured in your local `.env`.

### 4. Commit

```bash
git add <specific-files>     # avoid `git add .` — it can sweep in local artifacts
git commit -m "Add dark mode toggle"
```

### 5. Push and open a PR

```bash
git push -u origin feature/add-dark-mode
```

GitHub shows a **"Compare & pull request"** button — click it and write a short
description of the change.

### 6. Test the preview deployment

Vercel automatically builds a **preview URL** for the branch and posts it as a
comment on the PR. Click it to test the change in a real browser before merging.

### 7. Merge and deploy

Merge the PR (**Squash and merge** keeps `main` tidy), then delete the branch.
Vercel automatically deploys the updated `main` to production.

## Testing without polluting real data

All environments (local, preview, production) share one Supabase database, so
test accounts and test data are visible everywhere. When testing, sign up with a
throwaway/alias email (e.g. `dev+test@yourdomain.com`) rather than your real
account.

## Environment variables

- Local: copy `.env.example` to `.env` and fill in the values.
- Vercel: set the same variables under **Project Settings -> Environment
  Variables** (they apply to Production, Preview, and Development).
- `.env` is **not** committed to the repo. Only `.env.example` (placeholders) is.

## Never commit

- `.env` (secrets)
- `session.json`, `metrics.jsonl` (local tooling artifacts)
- `vite.config.ts.timestamp-*.mjs` (Vite temp files)
