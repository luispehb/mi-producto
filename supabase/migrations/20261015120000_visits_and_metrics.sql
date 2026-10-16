-- Visitas a la landing: una fila por visitante por día (UTC).
-- El visitante es anónimo: se identifica con un uuid en una cookie httpOnly.
create table public.visits (
  visitor_id uuid not null,
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  primary key (visitor_id, day)
);

-- Sin políticas: nadie escribe ni lee con la llave pública.
-- Solo /api/visit inserta (con la llave secreta), y siempre el visitor_id
-- de la cookie del propio visitante, así cada uno registra solo sus visitas.
alter table public.visits enable row level security;
revoke all on public.visits from anon, authenticated;

-- Métricas del panel admin, calculadas en la base.
-- Solo la llave secreta (service_role) puede ejecutarla.
create function public.admin_metrics(weeks int default 12)
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with
  signup_emails as (select lower(email) as e, created_at from public.signups),
  feedback_emails as (select distinct lower(email) as e from public.feedback where email is not null),
  -- La clave (visitor_id, day) hace que cada fila sea un día distinto
  per_visitor as (select visitor_id, count(*) as days from public.visits group by visitor_id),
  week_series as (
    select generate_series(
      date_trunc('week', now() at time zone 'utc') - make_interval(weeks => least(greatest(weeks, 1), 52) - 1),
      date_trunc('week', now() at time zone 'utc'),
      interval '1 week'
    )::date as week
  )
  select json_build_object(
    'signups',   (select count(*) from signup_emails),
    'activated', (select count(*) from signup_emails s where s.e in (select e from feedback_emails)),
    'visitors',  (select count(*) from per_visitor),
    'returning', (select count(*) from per_visitor where days >= 2),
    'weekly', (
      select coalesce(json_agg(json_build_object(
        'week', w.week,
        'new_signups', (select count(*) from signup_emails s
                        where (s.created_at at time zone 'utc') >= w.week
                          and (s.created_at at time zone 'utc') < w.week + 7),
        'visitors', (select count(distinct v.visitor_id) from public.visits v
                     where v.day >= w.week and v.day < w.week + 7)
      ) order by w.week), '[]'::json)
      from week_series w
    )
  );
$$;

revoke execute on function public.admin_metrics(int) from public, anon, authenticated;
grant execute on function public.admin_metrics(int) to service_role;
