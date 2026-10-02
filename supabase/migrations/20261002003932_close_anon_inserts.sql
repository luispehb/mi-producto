-- Los formularios ahora guardan desde el servidor (/api/signup y /api/feedback)
-- con la llave secreta (service_role), que tiene sus propios permisos.
-- Los visitantes anónimos ya no pueden insertar directo con la llave pública.
revoke insert on public.signups, public.feedback from anon;

-- Las políticas de insert dejan de nombrar a anon
alter policy "visitantes insertan signups"  on public.signups  to authenticated;
alter policy "visitantes insertan feedback" on public.feedback to authenticated;
