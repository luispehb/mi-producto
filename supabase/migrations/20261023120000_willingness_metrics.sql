-- Métricas de "willingness to use": se suman a admin_metrics() junto a las que ya había.
create or replace function public.admin_metrics(weeks int default 12)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with
  users as (select id, lower(email) as e, created_at from auth.users),
  -- La clave (user_id, day) hace que cada fila sea un día distinto
  per_user as (select user_id, count(*) as days from public.visits group by user_id),
  -- Por usuario: día (UTC) de su primer plan y cuántos días distintos creó planes
  plan_users as (
    select user_id,
           min((created_at at time zone 'utc')::date) as first_day,
           count(distinct (created_at at time zone 'utc')::date) as plan_days
    from public.plans group by user_id
  ),
  signup_emails as (select distinct lower(email) as e from public.signups),
  week_series as (
    select generate_series(
      date_trunc('week', now() at time zone 'utc') - make_interval(weeks => least(greatest(weeks, 1), 52) - 1),
      date_trunc('week', now() at time zone 'utc'),
      interval '1 week'
    )::date as week
  )
  select json_build_object(
    'users',     (select count(*) from users),
    'activated', (select count(*) from users u where exists (select 1 from plan_users p where p.user_id = u.id)),
    'returning', (select count(*) from per_user where days >= 2),
    -- Crearon su primer plan el mismo día (UTC) en que se registraron
    'first_day_plan', (select count(*) from users u join plan_users p on p.user_id = u.id
                       where p.first_day = (u.created_at at time zone 'utc')::date),
    -- Crearon planes en 2+ días distintos
    'second_plan', (select count(*) from plan_users where plan_days >= 2),
    -- Planes para los próximos 7 días desde que se crearon. starts_at es hora local
    -- sin zona: se compara por día, con el mismo margen de un día que la validación.
    'plans', (select count(*) from public.plans),
    'plans_soon', (select count(*) from public.plans
                   where starts_at::date >= (created_at at time zone 'utc')::date - 1
                     and starts_at::date <= (created_at at time zone 'utc')::date + 7),
    -- Emails de la lista de espera que después crearon cuenta
    'waitlist', (select count(*) from signup_emails),
    'waitlist_users', (select count(*) from signup_emails s where s.e in (select e from users)),
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
