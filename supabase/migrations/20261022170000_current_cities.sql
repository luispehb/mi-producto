-- Ciudad actual: dónde está cada viajero ahora. Una sola fila por usuario
-- (si cambia de ciudad, se actualiza). La ciudad sale de una lista cerrada de 50,
-- la misma de lib/current-city.ts; el país se guarda para poder agrupar en SQL.
-- Las fechas van sin zona: son días locales de la ciudad.
create table public.current_cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  city text not null,
  country text not null,
  arrived_on date not null,
  leaves_on date check (leaves_on >= arrived_on),
  created_at timestamptz not null default now(),
  check ((city, country) in (
    ('Nueva York', 'Estados Unidos'),
    ('Los Ángeles', 'Estados Unidos'),
    ('Miami', 'Estados Unidos'),
    ('Chicago', 'Estados Unidos'),
    ('San Francisco', 'Estados Unidos'),
    ('Las Vegas', 'Estados Unidos'),
    ('Toronto', 'Canadá'),
    ('Vancouver', 'Canadá'),
    ('Ciudad de México', 'México'),
    ('Cancún', 'México'),
    ('Ciudad de Guatemala', 'Guatemala'),
    ('San José', 'Costa Rica'),
    ('Ciudad de Panamá', 'Panamá'),
    ('Bogotá', 'Colombia'),
    ('Medellín', 'Colombia'),
    ('Cartagena', 'Colombia'),
    ('Buenos Aires', 'Argentina'),
    ('Río de Janeiro', 'Brasil'),
    ('São Paulo', 'Brasil'),
    ('Lima', 'Perú'),
    ('París', 'Francia'),
    ('Londres', 'Reino Unido'),
    ('Madrid', 'España'),
    ('Barcelona', 'España'),
    ('Roma', 'Italia'),
    ('Milán', 'Italia'),
    ('Venecia', 'Italia'),
    ('Ámsterdam', 'Países Bajos'),
    ('Berlín', 'Alemania'),
    ('Lisboa', 'Portugal'),
    ('Praga', 'República Checa'),
    ('Viena', 'Austria'),
    ('Atenas', 'Grecia'),
    ('Zúrich', 'Suiza'),
    ('Estambul', 'Turquía'),
    ('Tokio', 'Japón'),
    ('Kioto', 'Japón'),
    ('Seúl', 'Corea del Sur'),
    ('Bangkok', 'Tailandia'),
    ('Singapur', 'Singapur'),
    ('Hong Kong', 'China'),
    ('Shanghái', 'China'),
    ('Dubái', 'Emiratos Árabes Unidos'),
    ('Bali (Denpasar)', 'Indonesia'),
    ('Mumbai', 'India'),
    ('Ciudad del Cabo', 'Sudáfrica'),
    ('Marrakech', 'Marruecos'),
    ('El Cairo', 'Egipto'),
    ('Sídney', 'Australia'),
    ('Melbourne', 'Australia')
  ))
);

-- Cada viajero ve y toca solo su ciudad. anon no tiene acceso.
alter table public.current_cities enable row level security;
revoke all on public.current_cities from anon, authenticated;
grant select, insert, update, delete on public.current_cities to authenticated;

create policy "viajeros ven su ciudad" on public.current_cities
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "viajeros cargan su ciudad" on public.current_cities
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "viajeros cambian su ciudad" on public.current_cities
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "viajeros borran su ciudad" on public.current_cities
  for delete to authenticated
  using ((select auth.uid()) = user_id);
