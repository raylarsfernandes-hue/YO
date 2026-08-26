-- =========================================================
-- Sumaré Hip Hop Festival — Schema do banco (Supabase/Postgres)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Sequência para gerar os códigos de inscrição (SHHF-24-00032)
-- ---------------------------------------------------------
create sequence if not exists registration_code_seq start 1;

-- ---------------------------------------------------------
-- Tabela de oficinas/aulas
-- ---------------------------------------------------------
create table if not exists workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher text not null,
  event_day date not null,
  start_time text not null,          -- ex: "14:00"
  duration_minutes int not null default 70,
  max_vagas int not null default 30,
  active boolean not null default true,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Tabela de inscrições
-- ---------------------------------------------------------
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  workshop_id uuid not null references workshops(id) on delete restrict,
  full_name text not null,
  cpf text not null,
  phone text not null,
  email text not null,
  instagram text,
  consent_required boolean not null default false,
  consent_marketing boolean not null default false,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  checked_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- Impede duas inscrições confirmadas da mesma pessoa (CPF) na mesma aula
create unique index if not exists uq_cpf_workshop_confirmed
  on registrations (cpf, workshop_id)
  where (status = 'confirmed');

create index if not exists idx_registrations_workshop on registrations(workshop_id);
create index if not exists idx_registrations_status on registrations(status);
create index if not exists idx_registrations_cpf on registrations(cpf);

-- ---------------------------------------------------------
-- Administradores (quem pode acessar o dashboard)
-- ---------------------------------------------------------
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------
-- View pública das oficinas, já com vagas calculadas
-- (é isso que o formulário de inscrição consome)
-- ---------------------------------------------------------
create or replace view workshops_public as
select
  w.id,
  w.name,
  w.teacher,
  w.event_day,
  w.start_time,
  w.duration_minutes,
  w.max_vagas,
  w.active,
  w.order_index,
  coalesce(r.taken, 0) as taken,
  greatest(w.max_vagas - coalesce(r.taken, 0), 0) as vagas_restantes,
  case
    when not w.active then 'encerrada'
    when coalesce(r.taken, 0) >= w.max_vagas then 'esgotada'
    when (w.max_vagas - coalesce(r.taken, 0)) <= 5 then 'ultimas'
    else 'disponivel'
  end as status
from workshops w
left join (
  select workshop_id, count(*) as taken
  from registrations
  where status = 'confirmed'
  group by workshop_id
) r on r.workshop_id = w.id;

-- ---------------------------------------------------------
-- RPC: registrar inscrição (transação atômica, trava a vaga)
-- Esta função é o ÚNICO caminho para criar uma inscrição.
-- O "for update" trava a linha da oficina até o fim da transação,
-- então duas pessoas não conseguem ocupar a última vaga ao mesmo tempo.
-- ---------------------------------------------------------
create or replace function register_for_workshop(
  p_workshop_id uuid,
  p_full_name text,
  p_cpf text,
  p_phone text,
  p_email text,
  p_instagram text,
  p_consent_required boolean,
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
begin
  if p_consent_required is not true then
    raise exception 'CONSENTIMENTO_OBRIGATORIO';
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

  -- trava a linha da oficina até o fim desta transação
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
    code, workshop_id, full_name, cpf, phone, email, instagram,
    consent_required, consent_marketing
  ) values (
    v_code, p_workshop_id, trim(p_full_name), v_cpf_clean, trim(p_phone),
    lower(trim(p_email)), nullif(trim(p_instagram), ''),
    p_consent_required, coalesce(p_consent_marketing, false)
  );

  return query select v_code, v_name, v_teacher, v_day, v_start;
end;
$$;

-- ---------------------------------------------------------
-- RPC: buscar inscrição pelo código (usado na tela de confirmação)
-- ---------------------------------------------------------
create or replace function get_registration_by_code(p_code text)
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
  where r.code = p_code;
$$;

-- ---------------------------------------------------------
-- RPC: admin cancela inscrição (libera a vaga automaticamente,
-- pois o status deixa de contar como "confirmed")
-- ---------------------------------------------------------
create or replace function admin_cancel_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'NAO_AUTORIZADO';
  end if;
  update registrations set status = 'cancelled' where id = p_id;
end;
$$;

create or replace function admin_reactivate_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workshop_id uuid;
  v_cpf text;
  v_max int;
  v_taken int;
begin
  if not is_admin() then
    raise exception 'NAO_AUTORIZADO';
  end if;

  select workshop_id, cpf into v_workshop_id, v_cpf from registrations where id = p_id;

  select max_vagas into v_max from workshops where id = v_workshop_id for update;
  select count(*) into v_taken from registrations where workshop_id = v_workshop_id and status = 'confirmed';

  if v_taken >= v_max then
    raise exception 'ESGOTADA';
  end if;

  update registrations set status = 'confirmed' where id = p_id;
end;
$$;

-- ---------------------------------------------------------
-- RPC: admin marca/desmarca check-in
-- ---------------------------------------------------------
create or replace function admin_set_checkin(p_id uuid, p_checked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'NAO_AUTORIZADO';
  end if;
  update registrations set checked_in = p_checked where id = p_id;
end;
$$;

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table workshops enable row level security;
alter table registrations enable row level security;
alter table admins enable row level security;

drop policy if exists workshops_select_all on workshops;
create policy workshops_select_all on workshops for select using (true);

drop policy if exists workshops_admin_write on workshops;
create policy workshops_admin_write on workshops for all using (is_admin()) with check (is_admin());

-- Ninguém lê/escreve na tabela de inscrições diretamente.
-- Inscrição pública só entra via RPC (security definer).
-- Admin lê e atualiza via policy abaixo.
drop policy if exists registrations_admin_select on registrations;
create policy registrations_admin_select on registrations for select using (is_admin());

drop policy if exists registrations_admin_update on registrations;
create policy registrations_admin_update on registrations for update using (is_admin());

drop policy if exists admins_admin_select on admins;
create policy admins_admin_select on admins for select using (is_admin());

-- ---------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------
grant select on workshops_public to anon, authenticated;
grant execute on function register_for_workshop to anon, authenticated;
grant execute on function get_registration_by_code to anon, authenticated;
grant execute on function admin_cancel_registration to authenticated;
grant execute on function admin_reactivate_registration to authenticated;
grant execute on function admin_set_checkin to authenticated;
grant execute on function is_admin to authenticated;

-- ---------------------------------------------------------
-- Oficinas iniciais (edite livremente pelo dashboard depois)
-- ---------------------------------------------------------
insert into workshops (name, teacher, event_day, start_time, duration_minutes, max_vagas, order_index)
select * from (values
  ('Hip Hop', 'Clécio', date '2026-10-24', '14:00', 70, 30, 1),
  ('Discotecagem + Jam', 'Jeff', date '2026-10-24', '15:20', 70, 25, 2),
  ('Popping', 'Marcão', date '2026-10-24', '16:40', 70, 30, 3),
  ('House', 'Step', date '2026-10-24', '18:00', 70, 30, 4),
  ('Dancehall', 'Rafa', date '2026-10-25', '14:00', 70, 30, 5),
  ('Hip Hop', 'Wellington', date '2026-10-25', '15:20', 70, 30, 6),
  ('Jazz Funk', 'Nicolli', date '2026-10-25', '16:40', 70, 30, 7),
  ('Break', 'Lula', date '2026-10-25', '18:00', 70, 30, 8)
) as v(name, teacher, event_day, start_time, duration_minutes, max_vagas, order_index)
where not exists (select 1 from workshops);
