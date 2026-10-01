-- Waitlist: emails de visitantes interesados
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

-- Comentarios de visitantes (email opcional)
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (length(message) between 1 and 2000),
  email text check (email is null or length(email) <= 254),
  created_at timestamptz not null default now()
);

alter table public.signups  enable row level security;
alter table public.feedback enable row level security;

-- Cualquier visitante puede insertar
create policy "visitantes insertan signups"  on public.signups  for insert to anon, authenticated with check (true);
create policy "visitantes insertan feedback" on public.feedback for insert to anon, authenticated with check (true);

-- Solo usuarios con sesión iniciada pueden leer
create policy "usuarios con sesion leen signups"  on public.signups  for select to authenticated using (true);
create policy "usuarios con sesion leen feedback" on public.feedback for select to authenticated using (true);

revoke all on public.signups, public.feedback from anon, authenticated;
grant insert on public.signups, public.feedback to anon;
grant select, insert on public.signups, public.feedback to authenticated;
