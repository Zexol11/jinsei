# jinsei

your life journal. A minimal personal journaling web app. Write one rich-text entry per day, track your mood, and review your history through a calendar and insights dashboard.

This is a self-project containing things I want to learn, things like unit testing, deploying independently using free tier services, and other more!

## Monorepo Structure

```
jinsei/
├── backend/    # Laravel REST API (Sanctum auth, PostgreSQL)
└── frontend/   # Next.js App Router (TailwindCSS, TipTap)
```

## Prerequisites

- PHP 8.2+ & Composer
- Node.js 20+ & npm
- PostgreSQL 16

## Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_USERNAME, DB_PASSWORD
php artisan key:generate
php artisan migrate --seed
php artisan serve
# Runs at http://localhost:8000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL
npm install
npm run dev
# Runs at http://localhost:3000
```

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 15, TailwindCSS, TipTap   |
| Backend  | Laravel 12, Sanctum               |
| Database | PostgreSQL 16                     |

## Deployment

- **Frontend** → Vercel
- **Backend** → Railway or Render
- **Database** → Supabase or Neon
