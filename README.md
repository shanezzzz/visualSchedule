# Visual Schedule

NAU MCIT graduation project. This is a visual schedule management system built with Next.js and Supabase. It includes schedule management, staff settings, personal profile, and login/register pages.

## Features

- Day-based schedule view with drag-and-drop
- Staff management (CRUD)
- Supabase Auth login/register (cookie session)
- Personal profile with user info
- API routes for schedules and employees

## Tech Stack

- Next.js (App Router) + TypeScript
- Ant Design (UI)
- Supabase (Postgres + Auth)
- Axios (client API wrapper)

## Getting Started

### 1) Install

```bash
pnpm install
```

### 2) Environment Variables

Create `.env.local` in the project root:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

You can also use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if preferred.

### 3) Database Setup (Supabase SQL Editor)

```sql
create extension if not exists "pgcrypto";

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  role text,
  color text,
  created_by uuid not null default auth.uid()
);

create table public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  color text,
  created_by uuid not null default auth.uid()
);

alter table public.schedule_events
  add constraint schedule_events_time_check check (end_at > start_at);

create index if not exists employees_created_by_idx
  on public.employees (created_by);

create index if not exists schedule_events_employee_start_idx
  on public.schedule_events (employee_id, start_at);

create index if not exists schedule_events_created_by_idx
  on public.schedule_events (created_by);

alter table public.employees enable row level security;
alter table public.schedule_events enable row level security;

create policy "Employees are per-user" on public.employees
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Events are per-user" on public.schedule_events
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
```

### 4) Run

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Pages

- `/schedule` - Schedule management
- `/staff` - Staff settings
- `/profile` - Profile
- `/login` - Login/Register

## API Routes

Auth:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/user`

Employees:
- `GET /api/employees`
- `POST /api/employees`
- `PATCH /api/employees/:id`
- `DELETE /api/employees/:id`

Schedule events:
- `GET /api/schedule-events?start=...&end=...`
- `POST /api/schedule-events`
- `PATCH /api/schedule-events/:id`
- `DELETE /api/schedule-events/:id`

## Notes

- Auth is cookie-based (Supabase SSR).
- For drag-and-drop updates, the API returns the updated event. Use `?include=all` on `PATCH` if you need a full list.

