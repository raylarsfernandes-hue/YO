-- Atualização das datas do evento: sábado 21/11/2026 e domingo 22/11/2026
-- Só altera a data. Horários, vagas, prazos e inscrições existentes não mudam
-- (as inscrições apontam para a oficina, então acompanham a nova data sozinhas).
-- Os códigos já emitidos (ex.: SHHF-24-00001) continuam valendo como estão.

update public.workshops set event_day = date '2026-11-21' where event_day = date '2026-10-24';
update public.workshops set event_day = date '2026-11-22' where event_day = date '2026-10-25';

update public.event_settings
   set event_start_date = date '2026-11-21',
       event_end_date   = date '2026-11-22';

alter table public.event_settings
  alter column event_start_date set default '2026-11-21',
  alter column event_end_date   set default '2026-11-22';

-- Conferência
select event_day, count(*) as oficinas from public.workshops group by event_day order by event_day;
select event_start_date, event_end_date from public.event_settings;
