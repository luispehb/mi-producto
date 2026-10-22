-- El upsert de /api/app-visit usa on conflict (user_id, day), y Postgres pide
-- permiso de select sobre esas columnas. Cada usuario ve solo sus propias visitas.
grant select on public.visits to authenticated;

create policy "usuarios ven sus visitas" on public.visits
  for select to authenticated
  using ((select auth.uid()) = user_id);
