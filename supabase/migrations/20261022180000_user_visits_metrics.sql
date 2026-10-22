-- Las visitas anónimas de la landing pasan a landing_visits (conservan sus datos)
-- y visits queda para los usuarios con sesión que entran a la app.
alter table public.visits rename to landing_visits;
alter table public.landing_visits rename constraint visits_pkey to landing_visits_pkey;

-- Visitas a la app: una fila por usuario por día (UTC).
create table public.visits (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Cada usuario solo registra sus propias visitas; nadie las lee con la llave pública.
-- El panel admin las lee con la llave secreta (admin_metrics).
alter table public.visits enable row level security;
revoke all on public.visits from anon, authenticated;
grant insert on public.visits to authenticated;

create policy "usuarios registran sus visitas" on public.visits
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Métricas del panel admin sobre los usuarios de la app.
-- security definer para leer auth.users; solo la llave secreta (service_role) puede ejecutarla.
create or replace function public.admin_metrics(weeks int default 12)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with
  users as (select id, created_at from auth.users),
  -- La clave (user_id, day) hace que cada fila sea un día distinto
  per_user as (select user_id, count(*) as days from public.visits group by user_id),
  week_series as (
    select generate_series(
      date_trunc('week', now() at time zone 'utc') - make_interval(weeks => least(greatest(weeks, 1), 52) - 1),
      date_trunc('week', now() at time zone 'utc'),
      interval '1 week'
    )::date as week
  )
  select json_build_object(
    'users',     (select count(*) from users),
    'activated', (select count(*) from users u where exists (select 1 from public.plans p where p.user_id = u.id)),
    'returning', (select count(*) from per_user where days >= 2),
    'weekly', (
      select coalesce(json_agg(json_build_object(
        'week', w.week,
        'new_users', (select count(*) from users u
                      where (u.created_at at time zone 'utc') >= w.week
                        and (u.created_at at time zone 'utc') < w.week + 7),
        'active_users', (select count(distinct v.user_id) from public.visits v
                         where v.day >= w.week and v.day < w.week + 7)
      ) order by w.week), '[]'::json)
      from week_series w
    )
  );
$$;

revoke execute on function public.admin_metrics(int) from public, anon, authenticated;
grant execute on function public.admin_metrics(int) to service_role;
