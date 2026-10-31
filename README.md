# SA Silks

SA Silks is a saree manufacturing and wholesale management application for tracking business operations in one place.

## Project structure

The repository is separated by responsibility:

```text
sa-silks-app/
├── frontend/       React, TypeScript, Vite, and Tailwind application
├── backend/        FastAPI service
├── database/       SQL schema, Supabase migrations, and database setup
└── README.md       Project documentation
```

### Frontend

The React application provides:

- Dashboard with production, sales, and inventory summaries
- Worker management and weekly production tracking
- Production record management
- Materials and inventory management
- Sales management
- Worker payment tracking
- Weekly production and sales reports
- Supabase authentication and database integration

### Backend

The FastAPI service currently provides:

- `GET /health` for service status
- `GET /docs` for interactive Swagger documentation

### Database

Database resources are kept in [`database`](./database):

- [`schema.sql`](./database/schema.sql) is the canonical schema for a new Supabase project
- [`supabase`](./database/supabase) contains incremental migrations, including ownership-aware RLS
- [`SETUP_GUIDE.md`](./database/SETUP_GUIDE.md) contains database setup notes

The application uses `material_inventory` as its inventory source. The older
`raw_materials` migration is not used by the current frontend.

## Technology stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- FastAPI
- Supabase
- Lucide React

## Prerequisites

- Node.js 18 or newer
- Python 3.11 or newer
- A Supabase project

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/prajwalashok1974-gif/sa-silks-app.git
cd sa-silks-app
```

### 2. Set up the frontend

From the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Add your Supabase project details to `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

Start the frontend:

```powershell
npm run dev
```

Vite normally serves the application at `http://localhost:5173`.

### 3. Set up the database

Run [`database/schema.sql`](./database/schema.sql) once in the Supabase SQL Editor.
For an existing installation, run
[`20261031183000_harden_ownership_rls.sql`](./database/supabase/migrations/20261031183000_harden_ownership_rls.sql)
after the schema. Authenticated users can read shared business records, while
updates, deletes, and writes require `created_by = auth.uid()`.

### 4. Set up the backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Use `http://127.0.0.1:8000/health` for the health check and `http://127.0.0.1:8000/docs` for API documentation.

## Frontend commands

Run these commands from `frontend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |

## Environment and security

Keep real Supabase credentials in `frontend/.env`. Environment files and generated dependencies are ignored by Git. Never commit secrets. Protect application data with appropriate Supabase Row Level Security policies.

The browser uses only the Supabase project URL and publishable key. Never put a
Supabase secret/service-role key in the frontend. The frontend validates
required fields and positive numeric values before sending business records to
Supabase.

## Interview-ready design points

- React and TypeScript provide a responsive single-page operations dashboard.
- Supabase provides PostgreSQL, authentication, REST data access, and RLS.
- SQL migrations make security changes reproducible across environments.
- Production, sales, inventory, and payments are stored as relational records
  with foreign keys instead of browser-local state.
- The dashboard calculates operational KPIs from live database records.
