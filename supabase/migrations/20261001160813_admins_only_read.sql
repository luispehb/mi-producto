-- Lista de administradores: solo ellos pueden leer signups y feedback
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- Cada usuario solo puede ver si él mismo es admin
create policy "usuario ve su propia fila de admin" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- Lectura de datos: solo admins (antes bastaba con tener sesión)
drop policy "usuarios con sesion leen signups"  on public.signups;
drop policy "usuarios con sesion leen feedback" on public.feedback;

create policy "admins leen signups" on public.signups for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy "admins leen feedback" on public.feedback for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
