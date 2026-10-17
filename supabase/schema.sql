-- Expresso Gaúcho · banco de dados no Supabase
-- Rode este arquivo inteiro uma vez em: Supabase → SQL Editor → New query → Run.
-- Pode rodar de novo sem problema (é idempotente).

-- =====================================================================
-- Equipe da empresa: só estes e-mails podem publicar e informar atrasos
-- =====================================================================
create table if not exists public.equipe (
  email text primary key,
  nome  text,
  criado_em timestamptz not null default now()
);
alter table public.equipe enable row level security;

-- verdadeiro quando quem está logado é da equipe
create or replace function public.eh_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.equipe e
    where lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "equipe ve a si mesma" on public.equipe;
create policy "equipe ve a si mesma" on public.equipe
  for select to authenticated using (public.eh_equipe());

-- =====================================================================
-- Publicações: cada "Publicar no site" vira uma versão. O site usa a última.
-- conteudo = { linhas, horarios, avisos, paradas, rotas, tempos, log }
-- =====================================================================
create table if not exists public.publicacoes (
  id         bigint generated always as identity primary key,
  conteudo   jsonb not null,
  itens      text[] not null default '{}',
  autor      text,
  criado_em  timestamptz not null default now()
);
create index if not exists publicacoes_recentes on public.publicacoes (id desc);
alter table public.publicacoes enable row level security;

drop policy if exists "todos leem publicacoes" on public.publicacoes;
create policy "todos leem publicacoes" on public.publicacoes
  for select to anon, authenticated using (true);

drop policy if exists "equipe publica" on public.publicacoes;
create policy "equipe publica" on public.publicacoes
  for insert to authenticated
  with check (public.eh_equipe() and autor = auth.jwt() ->> 'email');

-- =====================================================================
-- Ao vivo: atraso/cancelamento informado pela empresa, por viagem e por dia
-- trip_key = "linha|tabela|sentido|viagem" (mesma chave usada no site)
-- dia      = "2026-10-17" ou "demo-2" (modo demonstração, terça)
-- =====================================================================
create table if not exists public.aovivo (
  dia        text not null,
  trip_key   text not null,
  atraso     integer not null default 0 check (atraso between -30 and 180),
  cancelada  boolean not null default false,
  parada     integer not null default 0 check (parada >= 0),
  minuto     real not null,               -- minuto do dia em que foi informado (relógio do app)
  autor      text,
  atualizado timestamptz not null default now(),
  primary key (dia, trip_key)
);
alter table public.aovivo enable row level security;

drop policy if exists "todos leem aovivo" on public.aovivo;
create policy "todos leem aovivo" on public.aovivo
  for select to anon, authenticated using (true);

drop policy if exists "equipe grava aovivo" on public.aovivo;
create policy "equipe grava aovivo" on public.aovivo
  for all to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

-- =====================================================================
-- Relatos de passageiros: "o ônibus passou agora". Qualquer um envia;
-- a equipe confirma (vira ao vivo) ou descarta.
-- =====================================================================
create table if not exists public.relatos (
  id         bigint generated always as identity primary key,
  dia        text not null check (char_length(dia) <= 20),
  trip_key   text not null check (char_length(trip_key) <= 160),
  atraso     integer not null check (atraso between -30 and 120),
  parada     integer not null check (parada between 0 and 200),
  minuto     real not null check (minuto >= 0 and minuto < 1440),
  criado_em  timestamptz not null default now()
);
create index if not exists relatos_dia on public.relatos (dia, trip_key, id desc);
alter table public.relatos enable row level security;

drop policy if exists "todos leem relatos" on public.relatos;
create policy "todos leem relatos" on public.relatos
  for select to anon, authenticated using (true);

drop policy if exists "qualquer um relata" on public.relatos;
create policy "qualquer um relata" on public.relatos
  for insert to anon, authenticated with check (true);

drop policy if exists "equipe descarta relatos" on public.relatos;
create policy "equipe descarta relatos" on public.relatos
  for delete to authenticated using (public.eh_equipe());

-- =====================================================================
-- Tempo real: avisa os aplicativos abertos quando algo muda
-- =====================================================================
do $$
begin
  begin alter publication supabase_realtime add table public.publicacoes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.aovivo;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.relatos;     exception when duplicate_object then null; end;
end $$;

-- =====================================================================
-- Limpeza: apaga relatos e informações ao vivo com mais de 7 dias
-- (rode quando quiser ou agende com pg_cron)
-- =====================================================================
create or replace function public.limpar_antigos() returns void
language sql security definer set search_path = public as $$
  delete from public.relatos where criado_em < now() - interval '7 days';
  delete from public.aovivo  where atualizado < now() - interval '7 days';
$$;

-- =====================================================================
-- Depois de rodar: cadastre o e-mail da equipe (troque pelo seu)
-- insert into public.equipe (email, nome) values ('voce@exemplo.com', 'Seu nome');
-- =====================================================================
