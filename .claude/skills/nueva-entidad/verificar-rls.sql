-- Prueba de RLS con dos usuarios. Todo pasa dentro de una transacción y
-- termina en rollback: ni los usuarios ni las filas quedan guardados.
-- Adaptá <tabla>, los insert y la columna que identifica cada fila (acá "title").
-- Correr con: supabase db query --linked -o json -f <este archivo>
begin;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@test.local', 'authenticated', 'authenticated');

create temp table _rls(paso text, valor int) on commit drop;
grant all on _rls to authenticated;
set local role authenticated;

-- Usuario A crea una fila y cuenta lo que ve
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.<tabla> (title /* , demás columnas */) values ('Fila de A' /* , ... */);
insert into _rls select 'A ve', count(*) from public.<tabla>;

-- Usuario B crea una fila, cuenta lo que ve e intenta tocar la de A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into public.<tabla> (title /* , demás columnas */) values ('Fila de B' /* , ... */);
insert into _rls select 'B ve', count(*) from public.<tabla>;

with u as (update public.<tabla> set title = 'cambiado por B' where title = 'Fila de A' returning 1)
insert into _rls select 'B edita de A', count(*) from u;

with d as (delete from public.<tabla> where title = 'Fila de A' returning 1)
insert into _rls select 'B borra de A', count(*) from d;

-- B intenta crear una fila a nombre de A: el with check la tiene que rechazar
do $$ begin
  insert into public.<tabla> (user_id, title /* , demás columnas */)
  values ('00000000-0000-0000-0000-00000000000a', 'Falsa' /* , ... */);
  insert into _rls values ('B crea como A', 1);
exception when insufficient_privilege then
  insert into _rls values ('B crea como A', 0);
end $$;

reset role;
-- Esperado: A ve 1, B ve 1, B edita de A 0, B borra de A 0, B crea como A 0
select json_agg(r) as resultado from _rls r;

rollback;
