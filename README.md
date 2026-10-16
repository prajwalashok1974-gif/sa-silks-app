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

- [`schema.sql`](./database/schema.sql) contains the database schema
- [`supabase`](./database/supabase) contains Supabase migrations
- [`SETUP_GUIDE.md`](./database/SETUP_GUIDE.md) contains database setup notes

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

Run [`database/schema.sql`](./database/schema.sql) in the Supabase SQL Editor. Apply migrations from [`database/supabase/migrations`](./database/supabase/migrations) as needed.

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

## Repository

https://github.com/prajwalashok1974-gif/sa-silks-app
