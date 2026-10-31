# SA Silks — Business Management System

A full-stack business management application for saree manufacturing and wholesale operations. It brings inventory, production, workers, sales, payments, and reporting into one workflow.

## Highlights

- Dashboard summaries for production, sales, and inventory
- Worker management and weekly production tracking
- Material inventory and purchase/usage records
- Production, sales, and worker payment workflows
- Weekly production and sales reports
- Supabase authentication and database integration
- Ownership-aware Row Level Security policies in Supabase migrations

## Architecture

```text
frontend/   React 18, TypeScript, Vite, Tailwind CSS
backend/    FastAPI service with health and Swagger endpoints
database/   PostgreSQL/Supabase schema, migrations, and setup guide
```

## Technology

React · TypeScript · Vite · Tailwind CSS · FastAPI · Supabase · PostgreSQL · Lucide React

## Run locally

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env` using your own Supabase project values.

### Database

Run [`database/schema.sql`](database/schema.sql) in the Supabase SQL Editor. Apply the migrations in [`database/supabase/migrations`](database/supabase/migrations) for incremental changes and ownership policies.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend exposes `/health` and `/docs` at `http://127.0.0.1:8000`.

## Frontend commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |

## Security notes

Keep local environment files out of version control. Use only publishable Supabase browser credentials in the frontend and never commit service-role keys or passwords. Review Row Level Security policies before deploying real business data.