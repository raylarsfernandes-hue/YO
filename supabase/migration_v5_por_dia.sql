-- =========================================================
-- Encontro de Danças Urbanas de Sumaré — Migração v5
-- Rode DEPOIS das migrações anteriores (schema, v2, v3, v4).
--
-- O que muda:
--   1. Inscrição passa a ser POR DIA (21/11, 22/11 ou os dois), não por oficina.
--   2. Vagas controladas por dia (editável em Admin > Configurações).
--   3. Professores ganham tabela própria, separada da programação,
--      e deixam de aparecer ligados a aula/horário em qualquer consulta pública.
--   4. Local oficial atualizado para o Colégio Alfredo Castro Donaire.
--
-- Seguro para rodar com inscrições já salvas: nada é apagado.
-- Pode ser rodado mais de uma vez.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Configurações: vagas por dia + local oficial
--    dia 1 = event_start_date (sábado 21/11), dia 2 = event_end_date (domingo 22/11)
-- ---------------------------------------------------------
alter table event_settings add column if not exists max_vagas_dia1 int not null default 100;
alter table event_settings add column if not exists max_vagas_dia2 int not null default 100;
-- texto usado na busca do Google Maps (mapa e botão "Como chegar")
alter table event_settings add column if not exists map_query text;

update event_settings
   set location_name    = 'Colégio Alfredo Castro Donaire',
       location_address = 'Rua São Timóteo, 121 - Jardim Santa Olívia - Nova Veneza / Região do Matão - Sumaré/SP - CEP 13180-461',
       map_query        = 'Colégio Alfredo Castro Donaire, Rua São Timóteo, 121, Jardim Santa Olívia, Sumaré - SP, 13180-461';

alter table event_settings alter column location_name set default 'Colégio Alfredo Castro Donaire';
alter table event_settings alter column location_address
  set default 'Rua São Timóteo, 121 - Jardim Santa Olívia - Nova Veneza / Região do Matão - Sumaré/SP - CEP 13180-461';

-- ---------------------------------------------------------
-- 2. Inscrições: passam a guardar o DIA de participação
--    As inscrições antigas recebem o dia da oficina em que estavam.
-- ---------------------------------------------------------
alter table registrations add column if not exists event_day date;

update registrations r
   set event_day = w.event_day
  from workshops w
 where r.workshop_id = w.id
   and r.event_day is null;

-- Quem estava em mais de uma oficina no mesmo dia vira uma inscrição só naquele dia.
-- Mantemos a mais antiga (preferindo a confirmada) e marcamos as repetidas como
-- canceladas. Nenhuma linha é apagada.
with ranked as (
  select id,
         row_number() over (
           partition by cpf, event_day
           order by (status = 'confirmed') desc, created_at
         ) as rn
    from registrations
   where status in ('confirmed', 'waitlisted')
     and event_day is not null
)
update registrations
   set status = 'cancelled', waitlist_position = null
 where id in (select id from ranked where rn > 1);

alter table registrations alter column event_day set not null;

-- a oficina deixa de ser obrigatória na inscrição (fica só nas linhas antigas)
alter table registrations alter column workshop_id drop not null;
alter table registrations drop constraint if exists registrations_workshop_id_fkey;
alter table registrations
  add constraint registrations_workshop_id_fkey
  foreign key (workshop_id) references workshops(id) on delete set null;

-- regra de duplicidade: mesmo CPF não pode ter duas inscrições ativas no mesmo dia
create unique index if not exists uq_cpf_day_active
  on registrations (cpf, event_day)
  where (status in ('confirmed', 'waitlisted'));

create index if not exists idx_registrations_day on registrations(event_day);

-- ---------------------------------------------------------
-- 3. Professores: tabela própria (sem vínculo com aula ou horário)
-- ---------------------------------------------------------
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  modality text,
  photo_url text,
  bio text,
  order_index int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- "Step" passa a ser "Sté Peres"
update workshops set teacher = 'Sté Peres' where teacher = 'Step';
update workshops set name = 'Breaking' where name = 'Break';

-- primeira carga: copia os professores já cadastrados nas oficinas (com foto e release)
insert into teachers (name, modality, photo_url, bio, order_index)
select w.teacher,
       w.name,
       w.teacher_photo_url,
       w.teacher_bio,
       coalesce(
         array_position(array['Clécio','Sté Peres','Marcão','Nicolli','Lula','Wellington','Rafa','Jeff'], w.teacher),
         100 + w.order_index
       )
  from workshops w
 where not exists (select 1 from teachers);

alter table teachers enable row level security;

drop policy if exists teachers_select_active on teachers;
create policy teachers_select_active on teachers for select using (active);

drop policy if exists teachers_admin_all on teachers;
create policy teachers_admin_all on teachers for all using (is_admin()) with check (is_admin());

grant select on teachers to anon, authenticated;
grant insert, update, delete on teachers to authenticated;

-- a coluna de professor da oficina deixa de ser obrigatória (a programação não mostra professor)
alter table workshops alter column teacher drop not null;

-- ---------------------------------------------------------
-- 4. Programação pública: aulas e horários, SEM professor
--    A tabela workshops deixa de ser legível por visitantes
--    (ela ainda guarda o professor de cada aula só para uso interno).
-- ---------------------------------------------------------
drop policy if exists workshops_select_all on workshops;

drop view if exists schedule_public;
create view schedule_public as
select id, name, event_day, start_time, duration_minutes, order_index
  from workshops
 where active;

grant select on schedule_public to anon, authenticated;

-- a view antiga expunha professor + horário + vagas por oficina
drop view if exists workshops_public;

-- ---------------------------------------------------------
-- 5. Vagas por dia
-- ---------------------------------------------------------
drop view if exists days_public;
create view days_public as
select
  d.event_day,
  d.day_number,
  d.max_vagas,
  coalesce(r.taken, 0) as taken,
  greatest(d.max_vagas - coalesce(r.taken, 0), 0) as vagas_restantes,
  case
    when coalesce(r.taken, 0) >= d.max_vagas then 'esgotado'
    when (d.max_vagas - coalesce(r.taken, 0)) <= 15 then 'ultimas'
    else 'disponivel'
  end as status
from (
  select event_start_date as event_day, 1 as day_number, max_vagas_dia1 as max_vagas from event_settings
  union all
  select event_end_date, 2, max_vagas_dia2 from event_settings
   where event_end_date <> event_start_date
) d
left join (
  select event_day, count(*) as taken
    from registrations
   where status = 'confirmed'
   group by event_day
) r on r.event_day = d.event_day;

grant select on days_public to anon, authenticated;

create or replace function day_capacity(p_day date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_day = event_start_date then max_vagas_dia1
    when p_day = event_end_date then max_vagas_dia2
    else null
  end
  from event_settings limit 1;
$$;

-- ---------------------------------------------------------
-- 6. Nova função de inscrição: por dia
--    p_days = lista de datas (uma ou as duas). Cada dia vira uma inscrição
--    com seu próprio código, todas no mesmo batch_id.
--    - Dia já inscrito com esse CPF é ignorado (sem duplicar).
--    - Se algum dia pedido estiver esgotado, nada é gravado (DIA_ESGOTADO).
-- ---------------------------------------------------------
drop function if exists register_for_workshops(uuid[], text, text, text, text, text, date, boolean, boolean, boolean, boolean);
drop function if exists register_for_workshop(uuid, text, text, text, text, text, date, boolean, boolean, boolean, boolean);
drop function if exists get_registration_by_code(text);

create or replace function register_for_days(
  p_days date[],
  p_full_name text,
  p_cpf text,
  p_phone text,
  p_email text,
  p_instagram text,
  p_birth_date date,
  p_consent_required boolean,
  p_image_consent boolean,
  p_guardian_ack boolean,
  p_consent_marketing boolean
) returns table(code text, event_day date, result_status text, batch_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid := gen_random_uuid();
  v_day date;
  v_days date[];
  v_new_days date[] := '{}';
  v_cpf_clean text;
  v_event_start date;
  v_event_end date;
  v_age int;
  v_is_minor boolean;
  v_guardian_status text;
  v_max int;
  v_taken int;
  v_seq bigint;
  v_code text;
begin
  if p_consent_required is not true then
    raise exception 'CONSENTIMENTO_OBRIGATORIO';
  end if;
  if p_image_consent is not true then
    raise exception 'CONSENTIMENTO_IMAGEM_OBRIGATORIO';
  end if;
  if p_birth_date is null or p_birth_date > current_date then
    raise exception 'DATA_NASCIMENTO_INVALIDA';
  end if;
  if p_days is null or array_length(p_days, 1) is null then
    raise exception 'NENHUM_DIA_SELECIONADO';
  end if;

  v_cpf_clean := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  if length(v_cpf_clean) <> 11 then
    raise exception 'CPF_INVALIDO';
  end if;
  if p_full_name is null or length(trim(p_full_name)) < 3 then
    raise exception 'NOME_INVALIDO';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'EMAIL_INVALIDO';
  end if;

  -- trava a linha de configurações: inscrições são processadas uma de cada vez,
  -- então a contagem de vagas por dia nunca passa do limite
  select event_start_date, event_end_date into v_event_start, v_event_end
    from event_settings limit 1 for update;

  v_age := extract(year from age(v_event_start, p_birth_date));
  v_is_minor := v_age < 18;
  if v_is_minor and p_guardian_ack is not true then
    raise exception 'CIENCIA_RESPONSAVEL_OBRIGATORIA';
  end if;
  v_guardian_status := case when v_is_minor then 'pendente' else 'nao_necessaria' end;

  select array_agg(distinct d order by d) into v_days from unnest(p_days) d;

  foreach v_day in array v_days
  loop
    if v_day is distinct from v_event_start and v_day is distinct from v_event_end then
      raise exception 'DIA_INVALIDO';
    end if;

    if exists (
      select 1 from registrations r
       where r.cpf = v_cpf_clean and r.event_day = v_day
         and r.status in ('confirmed', 'waitlisted')
    ) then
      continue; -- já inscrito neste dia
    end if;

    v_max := day_capacity(v_day);
    select count(*) into v_taken from registrations r
     where r.event_day = v_day and r.status = 'confirmed';

    if v_taken >= coalesce(v_max, 0) then
      raise exception 'DIA_ESGOTADO';
    end if;

    v_new_days := v_new_days || v_day;
  end loop;

  if array_length(v_new_days, 1) is null then
    raise exception 'JA_INSCRITO';
  end if;

  foreach v_day in array v_new_days
  loop
    v_seq := nextval('registration_code_seq');
    v_code := 'EDUS-' || to_char(v_day, 'DD') || '-' || lpad(v_seq::text, 5, '0');

    insert into registrations(
      code, event_day, full_name, cpf, phone, email, instagram, birth_date,
      consent_required, image_consent, guardian_ack, guardian_authorization_status,
      consent_marketing, status, batch_id
    ) values (
      v_code, v_day, trim(p_full_name), v_cpf_clean, trim(p_phone),
      lower(trim(p_email)), nullif(trim(p_instagram), ''), p_birth_date,
      p_consent_required, p_image_consent, coalesce(p_guardian_ack, false), v_guardian_status,
      coalesce(p_consent_marketing, false), 'confirmed', v_batch_id
    );

    return query select v_code, v_day, 'confirmed'::text, v_batch_id;
  end loop;
end;
$$;

grant execute on function register_for_days to anon, authenticated;

-- ---------------------------------------------------------
-- 7. Tela de confirmação: todos os dias ativos do participante daquele envio
--    (se ele já tinha o dia 21 e agora pegou o 22, a confirmação mostra os dois)
-- ---------------------------------------------------------
drop function if exists get_registrations_by_batch(uuid);

create or replace function get_registrations_by_batch(p_batch_id uuid)
returns table(code text, full_name text, event_day date, status text, batch_id uuid)
language sql
security definer
set search_path = public
as $$
  select r.code, r.full_name, r.event_day, r.status, r.batch_id
    from registrations r
   where r.status in ('confirmed', 'waitlisted')
     and r.cpf = (select rr.cpf from registrations rr where rr.batch_id = p_batch_id limit 1)
   order by r.event_day;
$$;

grant execute on function get_registrations_by_batch to anon, authenticated;

-- ---------------------------------------------------------
-- 8. Funções do admin, agora por dia
-- ---------------------------------------------------------
create or replace function admin_reactivate_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
  v_cpf text;
  v_taken int;
begin
  if not is_admin() then
    raise exception 'NAO_AUTORIZADO';
  end if;

  select event_day, cpf into v_day, v_cpf from registrations where id = p_id;

  perform 1 from event_settings for update;

  if exists (
    select 1 from registrations
     where cpf = v_cpf and event_day = v_day and id <> p_id
       and status in ('confirmed', 'waitlisted')
  ) then
    raise exception 'JA_INSCRITO';
  end if;

  select count(*) into v_taken from registrations where event_day = v_day and status = 'confirmed';
  if v_taken >= coalesce(day_capacity(v_day), 0) then
    raise exception 'ESGOTADO';
  end if;

  update registrations set status = 'confirmed', waitlist_position = null where id = p_id;
end;
$$;

create or replace function admin_promote_waitlist(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
  v_taken int;
begin
  if not is_admin() then
    raise exception 'NAO_AUTORIZADO';
  end if;

  select event_day into v_day from registrations where id = p_id;

  perform 1 from event_settings for update;

  select count(*) into v_taken from registrations where event_day = v_day and status = 'confirmed';
  if v_taken >= coalesce(day_capacity(v_day), 0) then
    raise exception 'ESGOTADO';
  end if;

  update registrations set status = 'confirmed', waitlist_position = null where id = p_id;
end;
$$;

grant execute on function admin_reactivate_registration to authenticated;
grant execute on function admin_promote_waitlist to authenticated;

-- ---------------------------------------------------------
-- Conferência (rode e confira o resultado)
-- ---------------------------------------------------------
select * from days_public order by event_day;
select name, event_day, start_time from schedule_public order by event_day, start_time;
select name, modality, order_index from teachers order by order_index;
select location_name, location_address, map_query, max_vagas_dia1, max_vagas_dia2 from event_settings;
