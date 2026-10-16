# SA Silks

SA Silks is a saree manufacturing and wholesale management application built for tracking day-to-day business operations in one place.

## Features

- Dashboard with production, sales, and inventory summaries
- Worker management and weekly production tracking
- Production record management
- Materials and inventory management
- Sales management
- Worker payment tracking
- Weekly production and sales reports
- Supabase authentication and database integration

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide React

## Prerequisites

- Node.js 18 or newer
- A Supabase project

## Getting started

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/prajwalashok1974-gif/sa-silks-app.git
   cd sa-silks-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Add your Supabase project URL and anonymous key to `.env`:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

5. Set up the database by running the SQL in [`schema.sql`](./schema.sql) in the Supabase SQL Editor. Apply any additional migrations in [`supabase/migrations`](./supabase/migrations) as needed.

6. Start the development server:

   ```bash
   npm run dev
   ```

   Vite will print the local URL in the terminal, normally `http://localhost:5173`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |

## Environment and security

Keep your real Supabase credentials in `.env`. The `.env` file is ignored by Git and must not be committed. The browser-facing Supabase anonymous key is intended for client applications; protect data with appropriate Supabase Row Level Security policies.

## Repository

https://github.com/prajwalashok1974-gif/sa-silks-app
