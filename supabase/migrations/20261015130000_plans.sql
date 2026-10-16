-- Planes: algo concreto que un viajero propone hacer en una ciudad.
-- starts_at va sin zona horaria: es la hora local de la ciudad del plan,
-- tal como la eligió el viajero.
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  city text not null check (city = btrim(city) and char_length(city) between 2 and 60),
  title text not null check (title = btrim(title) and char_length(title) between 3 and 120),
  starts_at timestamp not null,
  energy text not null check (energy in ('tranquilo', 'activo', 'fiestero')),
  spots smallint not null check (spots between 1 and 20),
  created_at timestamptz not null default now()
);

create index plans_user_id_starts_at_idx on public.plans (user_id, starts_at);

-- Cada viajero ve y toca solo sus planes. anon no tiene acceso.
alter table public.plans enable row level security;
revoke all on public.plans from anon, authenticated;
grant select, insert, update, delete on public.plans to authenticated;

create policy "viajeros ven sus planes" on public.plans
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "viajeros crean sus planes" on public.plans
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "viajeros editan sus planes" on public.plans
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "viajeros borran sus planes" on public.plans
  for delete to authenticated
  using ((select auth.uid()) = user_id);
