# Visual Schedule

NAU MCIT 毕业设计项目。该系统是一个可视化日程管理平台，包含日程管理、员工设置、个人页面与登录/注册页面。

## 功能

- 日程视图（支持拖拽调整）
- 员工管理（增删改查）
- Supabase Auth 登录/注册（Cookie 会话）
- 个人信息展示
- 日程与员工的 API 路由

## 技术栈

- Next.js（App Router）+ TypeScript
- Ant Design（UI）
- Supabase（Postgres + Auth）
- Axios（客户端请求封装）

## 选型理由

- Next.js：前后端一体的全栈框架，路由与 API 开发效率高，便于部署到 Vercel。
- TypeScript：提升代码可维护性，降低出错风险。
- Ant Design：适合管理类系统的成熟组件库，能够快速搭建 UI。
- Supabase：托管型 Postgres + Auth，集成简单，适合快速完成原型。
- Axios：请求封装简单，便于统一错误处理与拦截逻辑。

## 项目结构

```
.
├── app
│   ├── (auth)
│   ├── (dashboard)
│   ├── api
│   ├── globals.css
│   └── layout.tsx
├── components
├── lib
│   └── supabase
├── public
└── README.md
```

## 快速开始

### 1) 安装依赖

```bash
pnpm install
```

### 2) 环境变量

在项目根目录创建 `.env.local`：

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

也可以使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。

### 3) 数据库初始化（Supabase SQL Editor）

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

### 4) 启动项目

```bash
pnpm dev
```

打开 `http://localhost:3000`。

## 页面入口

- `/schedule` - Schedule management
- `/staff` - Staff settings
- `/profile` - Profile
- `/login` - Login/Register

## API 接口

认证：
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/user`

员工：
- `GET /api/employees`
- `POST /api/employees`
- `PATCH /api/employees/:id`
- `DELETE /api/employees/:id`

日程：
- `GET /api/schedule-events?start=...&end=...`
- `POST /api/schedule-events`
- `PATCH /api/schedule-events/:id`
- `DELETE /api/schedule-events/:id`

## 说明

- 认证采用 Cookie 会话（Supabase SSR）。
- 拖拽更新事件时，接口默认返回更新后的单条数据；如需全量列表可使用 `?include=all`。

## 部署（Vercel）

1. 将项目推送到 GitHub（或其他 Git 平台）。
2. 在 Vercel 中导入该仓库。
3. 在 Vercel 配置环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - （可选）`NEXT_PUBLIC_ALLOWED_ORIGINS`
4. 部署完成后即可访问。
