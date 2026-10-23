-- Para el mapa de /explorar: cuántos planes hay en cada ciudad entre dos días.
-- Solo conteos (nada de cada plan), con el mismo tope de días que explore_plans().
create function public.explore_city_counts(p_from date, p_to date)
returns table (city text, plans bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.city, count(*)
  from public.plans p
  where auth.uid() is not null
    and p.starts_at::date between greatest(p_from, current_date - 1) and least(p_to, current_date + 8)
  group by p.city;
$$;

revoke execute on function public.explore_city_counts(date, date) from public, anon;
grant execute on function public.explore_city_counts(date, date) to authenticated;
