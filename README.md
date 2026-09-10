# Semester Flow

A student assignment & deadline tracker — organize your semester, log assignments
by class and type, and see your workload at a glance.

Built with **React + Vite + TypeScript**, styled with **Tailwind CSS + shadcn/ui**,
and backed by **Supabase** (Postgres + Auth).

## Features

- Semester management (create, activate, edit)
- Assignment tracking by class, type, and due date
- Dashboard with workload visualization
- Email/password authentication with password recovery

## Getting started

### Prerequisites

- Node.js 18+ (or [Bun](https://bun.sh))
- A Supabase project (free tier is fine)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local env file from the template and fill in your Supabase
   project's URL and publishable (anon) key:

   ```bash
   cp .env.example .env
   ```

3. Apply the database migrations in `supabase/migrations/` to your project
   (via the Supabase SQL editor or the Supabase CLI).

4. Run the dev server:

   ```bash
   npm run dev        # http://localhost:8080
   ```

## Scripts

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start the dev server         |
| `npm run build`   | Production build             |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Run ESLint                   |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the branch / PR / preview workflow.
