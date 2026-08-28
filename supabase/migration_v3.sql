-- =========================================================
-- Sumaré Hip Hop Festival — Migração v3
-- Rode DEPOIS do schema.sql e do migration_v2.sql.
-- Adiciona: limite de 150 vagas, lista de espera automática,
-- inscrição em múltiplas oficinas de uma vez (mesmo participante,
-- várias oficinas, um único envio) e dados de professor (foto/bio).
-- Não apaga nada — seguro rodar com inscrições já salvas.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Limite de vagas: 150 por oficina
-- ---------------------------------------------------------
update workshops set max_vagas = 150;
alter table workshops alter column max_vagas set default 150;

-- ---------------------------------------------------------
-- 2. Dados do professor (foto + biografia/release)
-- ---------------------------------------------------------
alter table workshops add column if not exists teacher_photo_url text;
alter table workshops add column if not exists teacher_bio text;

-- ---------------------------------------------------------
-- 3. Lista de espera: novo status + posição + agrupamento por envio
-- ---------------------------------------------------------
alter table registrations drop constraint if exists registrations_status_check;
alter table registrations add constraint registrations_status_check
  check (status in ('confirmed', 'waitlisted', 'cancelled'));

alter table registrations add column if not exists waitlist_position int;
alter table registrations add column if not exists batch_id uuid;

create index if not exists idx_registrations_batch on registrations(batch_id);

-- a vaga "ocupada" agora é só quem está confirmed (waitlisted não conta como vaga)
create or replace view workshops_public as
select
  w.id,
  w.name,
  w.teacher,
  w.teacher_photo_url,
  w.teacher_bio,
  w.event_day,
  w.start_time,
  w.duration_minutes,
  w.max_vagas,
  w.active,
  w.order_index,
  coalesce(r.taken, 0) as taken,
  coalesce(r.waiting, 0) as waiting,
  greatest(w.max_vagas - coalesce(r.taken, 0), 0) as vagas_restantes,
  case
    when not w.active then 'encerrada'
    when coalesce(r.taken, 0) >= w.max_vagas then 'esgotada'
    when (w.max_vagas - coalesce(r.taken, 0)) <= 15 then 'ultimas'
    else 'disponivel'
  end as status
from workshops w
left join (
  select
    workshop_id,
    count(*) filter (where status = 'confirmed') as taken,
    count(*) filter (where status = 'waitlisted') as waiting
  from registrations
  group by workshop_id
) r on r.workshop_id = w.id;

grant select on workshops_public to anon, authenticated;

-- ---------------------------------------------------------
-- 4. Nova função: inscrever um participante em VÁRIAS oficinas
--    de uma vez, com um único formulário.
--    Cada oficina vira uma linha em registrations, todas com o
--    mesmo batch_id — assim o admin e a confirmação conseguem
--    agrupar "1 participante + N oficinas".
--    Se uma oficina específica já estiver com 150 confirmados,
--    aquela entra automaticamente como 'waitlisted' (lista de
--    espera) em vez de travar a inscrição inteira.
-- ---------------------------------------------------------
create or replace function register_for_workshops(
  p_workshop_ids uuid[],
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
) returns table(
  code text, workshop_id uuid, workshop_name text, teacher text,
  event_day date, start_time text, result_status text, batch_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid := gen_random_uuid();
  v_workshop_id uuid;
  v_max int;
  v_active boolean;
  v_taken int;
  v_waiting int;
  v_cpf_clean text;
  v_code text;
  v_seq bigint;
  v_day_suffix text;
  v_name text;
  v_teacher text;
  v_day date;
  v_start text;
  v_event_start date;
  v_age int;
  v_is_minor boolean;
  v_guardian_status text;
  v_result_status text;
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

  if p_workshop_ids is null or array_length(p_workshop_ids, 1) is null then
    raise exception 'NENHUMA_OFICINA_SELECIONADA';
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

  select coalesce(event_start_date, current_date) into v_event_start from event_settings limit 1;
  if v_event_start is null then
    v_event_start := current_date;
  end if;

  v_age := extract(year from age(v_event_start, p_birth_date));
  v_is_minor := v_age < 18;

  if v_is_minor and p_guardian_ack is not true then
    raise exception 'CIENCIA_RESPONSAVEL_OBRIGATORIA';
  end if;

  v_guardian_status := case when v_is_minor then 'pendente' else 'nao_necessaria' end;

  -- processa cada oficina selecionada, uma de cada vez, cada uma com sua própria trava
  foreach v_workshop_id in array p_workshop_ids
  loop
    select w.max_vagas, w.active, w.name, w.teacher, w.event_day, w.start_time
      into v_max, v_active, v_name, v_teacher, v_day, v_start
    from workshops w
    where w.id = v_workshop_id
    for update;

    if not found then
      raise exception 'OFICINA_NAO_ENCONTRADA';
    end if;

    if not v_active then
      continue; -- ignora oficinas com inscrições encerradas
    end if;

    if exists (
      select 1 from registrations
      where workshop_id = v_workshop_id
        and cpf = v_cpf_clean
        and status in ('confirmed', 'waitlisted')
    ) then
      continue; -- já inscrito ou na espera desta oficina, pula sem duplicar
    end if;

    select count(*) filter (where status = 'confirmed'),
           count(*) filter (where status = 'waitlisted')
      into v_taken, v_waiting
    from registrations
    where workshop_id = v_workshop_id;

    v_seq := nextval('registration_code_seq');
    v_day_suffix := to_char(v_day, 'DD');
    v_code := 'SHHF-' || v_day_suffix || '-' || lpad(v_seq::text, 5, '0');

    if v_taken < v_max then
      v_result_status := 'confirmed';

      insert into registrations(
        code, workshop_id, full_name, cpf, phone, email, instagram, birth_date,
        consent_required, image_consent, guardian_ack, guardian_authorization_status,
        consent_marketing, status, batch_id
      ) values (
        v_code, v_workshop_id, trim(p_full_name), v_cpf_clean, trim(p_phone),
        lower(trim(p_email)), nullif(trim(p_instagram), ''), p_birth_date,
        p_consent_required, p_image_consent, coalesce(p_guardian_ack, false), v_guardian_status,
        coalesce(p_consent_marketing, false), 'confirmed', v_batch_id
      );
    else
      v_result_status := 'waitlisted';

      insert into registrations(
        code, workshop_id, full_name, cpf, phone, email, instagram, birth_date,
        consent_required, image_consent, guardian_ack, guardian_authorization_status,
        consent_marketing, status, batch_id, waitlist_position
      ) values (
        v_code, v_workshop_id, trim(p_full_name), v_cpf_clean, trim(p_phone),
        lower(trim(p_email)), nullif(trim(p_instagram), ''), p_birth_date,
        p_consent_required, p_image_consent, coalesce(p_guardian_ack, false), v_guardian_status,
        coalesce(p_consent_marketing, false), 'waitlisted', v_batch_id, v_waiting + 1
      );
    end if;

    return query select v_code, v_workshop_id, v_name, v_teacher, v_day, v_start, v_result_status, v_batch_id;
  end loop;

  if not found then
    raise exception 'NAO_FOI_POSSIVEL_INSCREVER';
  end if;
end;
$$;

grant execute on function register_for_workshops to anon, authenticated;

-- ---------------------------------------------------------
-- 5. Buscar todas as inscrições de um envio (para a tela de confirmação)
-- ---------------------------------------------------------
create or replace function get_registrations_by_batch(p_batch_id uuid)
returns table(
  code text, full_name text, workshop_name text, teacher text,
  event_day date, start_time text, status text
)
language sql
security definer
set search_path = public
as $$
  select r.code, r.full_name, w.name, w.teacher, w.event_day, w.start_time, r.status
  from registrations r
  join workshops w on w.id = r.workshop_id
  where r.batch_id = p_batch_id
  order by w.event_day, w.start_time;
$$;

grant execute on function get_registrations_by_batch to anon, authenticated;

-- ---------------------------------------------------------
-- 6. Promover alguém da lista de espera para vaga confirmada (uso do admin)
-- ---------------------------------------------------------
create or replace function admin_promote_waitlist(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workshop_id uuid;
  v_max int;
  v_taken int;
begin
  if not is_admin() then
    raise exception 'NAO_AUTORIZADO';
  end if;

  select workshop_id into v_workshop_id from registrations where id = p_id;
  select max_vagas into v_max from workshops where id = v_workshop_id for update;
  select count(*) into v_taken from registrations where workshop_id = v_workshop_id and status = 'confirmed';

  if v_taken >= v_max then
    raise exception 'ESGOTADA';
  end if;

  update registrations set status = 'confirmed', waitlist_position = null where id = p_id;
end;
$$;

grant execute on function admin_promote_waitlist to authenticated;

-- register_for_workshop (singular, versão antiga) continua existindo para não
-- quebrar nada que ainda dependa dela, mas o site agora usa a versão plural acima.
