-- ============================================================
-- GERA VALE — Tabelas para Recibo de Entrega de Peças
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── Tabela principal ─────────────────────────────────────────
create table if not exists recibos (
  id            uuid primary key default gen_random_uuid(),
  data_entrega  date not null,
  cliente_nome  text not null,
  cliente_cnpj  text,
  endereco      text not null,
  equipamento_modelo text not null,
  equipamento_serie  text not null,
  os            text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now()
);

-- ── Itens do recibo ──────────────────────────────────────────
create table if not exists recibo_itens (
  id          uuid primary key default gen_random_uuid(),
  recibo_id   uuid not null references recibos(id) on delete cascade,
  codigo      text not null,
  descricao   text not null,
  quantidade  numeric(10,2) not null,
  unidade     text not null default 'UN',
  created_at  timestamptz default now()
);

-- ── Índices ──────────────────────────────────────────────────
create index if not exists recibos_created_at_idx on recibos(created_at desc);
create index if not exists recibo_itens_recibo_id_idx on recibo_itens(recibo_id);

-- ── RLS ──────────────────────────────────────────────────────
alter table recibos enable row level security;
alter table recibo_itens enable row level security;

-- Todos autenticados leem e inserem
create policy "recibos_select" on recibos
  for select using (auth.role() = 'authenticated');

create policy "recibos_insert" on recibos
  for insert with check (auth.role() = 'authenticated');

create policy "recibo_itens_select" on recibo_itens
  for select using (auth.role() = 'authenticated');

create policy "recibo_itens_insert" on recibo_itens
  for insert with check (auth.role() = 'authenticated');

-- Só admins editam e excluem
create policy "recibos_update" on recibos
  for update using (is_admin());

create policy "recibos_delete" on recibos
  for delete using (is_admin());

create policy "recibo_itens_update" on recibo_itens
  for update using (is_admin());

create policy "recibo_itens_delete" on recibo_itens
  for delete using (is_admin());
