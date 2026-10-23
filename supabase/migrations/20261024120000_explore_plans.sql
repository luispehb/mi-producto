-- Explorar planes: cada viajero puede ver los planes de todos en una ciudad,
-- de hoy a 7 días, para sumarse. Solo lectura y sin datos del creador;
-- la tabla plans y sus políticas no cambian (cada uno toca solo lo suyo).

-- La ciudad del plan pasa a la lista cerrada de lib/current-city.ts (la misma de
-- current_cities), así la búsqueda compara exacto. "not valid": los planes viejos
-- con texto libre quedan como están; se chequean las filas nuevas y las ediciones.
-- Si sumás una ciudad, sumala en lib/current-city.ts y en los dos check.
alter table public.plans add constraint plans_city_in_list check (city in (
  'Nueva York', 'Los Ángeles', 'Miami', 'Chicago', 'San Francisco', 'Las Vegas',
  'Toronto', 'Vancouver', 'Ciudad de México', 'Cancún',
  'Ciudad de Guatemala', 'San José', 'Ciudad de Panamá', 'Bogotá', 'Medellín',
  'Cartagena', 'Buenos Aires', 'Río de Janeiro', 'São Paulo', 'Lima',
  'París', 'Londres', 'Madrid', 'Barcelona', 'Roma', 'Milán', 'Venecia',
  'Ámsterdam', 'Berlín', 'Lisboa', 'Praga', 'Viena', 'Atenas', 'Zúrich', 'Estambul',
  'Tokio', 'Kioto', 'Seúl', 'Bangkok', 'Singapur', 'Hong Kong', 'Shanghái',
  'Dubái', 'Bali (Denpasar)', 'Mumbai',
  'Ciudad del Cabo', 'Marrakech', 'El Cairo', 'Sídney', 'Melbourne'
)) not valid;

create index plans_city_starts_at_idx on public.plans (city, starts_at);

-- Planes de una ciudad entre dos días. security definer para leer planes ajenos,
-- pero devuelve solo los datos del plan (nunca user_id) y "mine" para marcar los propios.
-- El tope de 7 días se aplica acá aunque la llamen con otro rango. starts_at es hora
-- local sin zona: se compara por día, con el margen de un día de yesterday() en lib/plans.ts.
create function public.explore_plans(p_city text, p_from date, p_to date)
returns table (id uuid, city text, title text, starts_at timestamp, energy text, spots smallint, mine boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.city, p.title, p.starts_at, p.energy, p.spots, p.user_id = auth.uid()
  from public.plans p
  where auth.uid() is not null
    and p.city = p_city
    and p.starts_at::date between greatest(p_from, current_date - 1) and least(p_to, current_date + 8)
  order by p.starts_at;
$$;

revoke execute on function public.explore_plans(text, date, date) from public, anon;
grant execute on function public.explore_plans(text, date, date) to authenticated;
