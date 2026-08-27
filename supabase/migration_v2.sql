-- =========================================================
-- Sumaré Hip Hop Festival — Migração v2
-- Rode este arquivo DEPOIS do schema.sql original, no SQL Editor do Supabase.
-- Ele só ADICIONA coisas novas — não apaga nem recria tabelas existentes,
-- então é seguro rodar mesmo com inscrições já salvas.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Novos campos em registrations
-- ---------------------------------------------------------
alter table registrations add column if not exists birth_date date;
alter table registrations add column if not exists image_consent boolean not null default false;
alter table registrations add column if not exists guardian_ack boolean not null default false;
alter table registrations add column if not exists guardian_authorization_status text not null default 'nao_necessaria';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'registrations_guardian_status_check'
  ) then
    alter table registrations add constraint registrations_guardian_status_check
      check (guardian_authorization_status in ('nao_necessaria', 'pendente', 'confirmada'));
  end if;
end $$;

-- ---------------------------------------------------------
-- 2. Configurações do evento (linha única, editável pelo admin)
--    Local, datas e link do PDF de autorização ficam aqui —
--    mude em um lugar só e reflete em todo o sistema.
-- ---------------------------------------------------------
create table if not exists event_settings (
  id boolean primary key default true check (id),
  location_name text not null default 'CÉU das Artes de Sumaré',
  location_address text not null default 'Sumaré/SP',
  event_start_date date not null default '2026-10-24',
  event_end_date date not null default '2026-10-25',
  guardian_authorization_pdf_url text
);

insert into event_settings (id) values (true) on conflict (id) do nothing;

alter table event_settings enable row level security;

drop policy if exists event_settings_select_all on event_settings;
create policy event_settings_select_all on event_settings for select using (true);

drop policy if exists event_settings_admin_write on event_settings;
create policy event_settings_admin_write on event_settings for all using (is_admin()) with check (is_admin());

grant select on event_settings to anon, authenticated;
grant update on event_settings to authenticated;

-- ---------------------------------------------------------
-- 3. Atualizar a função de inscrição para receber os novos campos
--    e calcular automaticamente se a pessoa é menor de idade
--    NA DATA DO EVENTO (não na data em que se inscreveu).
-- ---------------------------------------------------------
create or replace function register_for_workshop(
  p_workshop_id uuid,
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
  code text, workshop_name text, teacher text, event_day date, start_time text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max int;
  v_active boolean;
  v_taken int;
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

  select w.max_vagas, w.active, w.name, w.teacher, w.event_day, w.start_time
    into v_max, v_active, v_name, v_teacher, v_day, v_start
  from workshops w
  where w.id = p_workshop_id
  for update;

  if not found then
    raise exception 'OFICINA_NAO_ENCONTRADA';
  end if;

  if not v_active then
    raise exception 'INSCRICOES_ENCERRADAS';
  end if;

  select count(*) into v_taken
  from registrations
  where workshop_id = p_workshop_id and status = 'confirmed';

  if v_taken >= v_max then
    raise exception 'ESGOTADA';
  end if;

  if exists (
    select 1 from registrations
    where workshop_id = p_workshop_id
      and cpf = v_cpf_clean
      and status = 'confirmed'
  ) then
    raise exception 'JA_INSCRITO';
  end if;

  v_seq := nextval('registration_code_seq');
  v_day_suffix := to_char(v_day, 'DD');
  v_code := 'SHHF-' || v_day_suffix || '-' || lpad(v_seq::text, 5, '0');

  insert into registrations(
    code, workshop_id, full_name, cpf, phone, email, instagram, birth_date,
    consent_required, image_consent, guardian_ack, guardian_authorization_status,
    consent_marketing
  ) values (
    v_code, p_workshop_id, trim(p_full_name), v_cpf_clean, trim(p_phone),
    lower(trim(p_email)), nullif(trim(p_instagram), ''), p_birth_date,
    p_consent_required, p_image_consent, coalesce(p_guardian_ack, false), v_guardian_status,
    coalesce(p_consent_marketing, false)
  );

  return query select v_code, v_name, v_teacher, v_day, v_start;
end;
$$;

grant execute on function register_for_workshop to anon, authenticated;

-- ---------------------------------------------------------
-- 4. Reforçar/garantir as 8 oficinas de exemplo
--    (roda seguro mesmo se algumas já existirem — verifica por nome + professor)
-- ---------------------------------------------------------
insert into workshops (name, teacher, event_day, start_time, duration_minutes, max_vagas, order_index)
select v.name, v.teacher, v.event_day, v.start_time, v.duration_minutes, v.max_vagas, v.order_index
from (values
  ('Hip Hop', 'Clécio', date '2026-10-24', '14:00', 70, 30, 1),
  ('Discotecagem + Jam', 'Jeff', date '2026-10-24', '15:20', 70, 30, 2),
  ('Popping', 'Marcão', date '2026-10-24', '16:40', 70, 30, 3),
  ('House', 'Step', date '2026-10-24', '18:00', 70, 30, 4),
  ('Dancehall', 'Rafa', date '2026-10-25', '14:00', 70, 30, 5),
  ('Hip Hop', 'Wellington', date '2026-10-25', '15:20', 70, 30, 6),
  ('Jazz Funk', 'Nicolli', date '2026-10-25', '16:40', 70, 30, 7),
  ('Break', 'Lula', date '2026-10-25', '18:00', 70, 30, 8)
) as v(name, teacher, event_day, start_time, duration_minutes, max_vagas, order_index)
where not exists (
  select 1 from workshops w where w.name = v.name and w.teacher = v.teacher
);
