-- ============================================================
-- GERA VALE — Schema Supabase
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj text,
  endereco text,
  contato_tecnico text,
  contato_compras text,
  contato_fiscal text,
  arquivado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contratos
create table contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  numero text,
  tipo text check (tipo in ('manutencao','locacao')) not null,
  inicio date,
  termino date,
  nota_fiscal boolean default false,
  apr boolean default false,
  horas_contratadas numeric default 0,
  km_contratados numeric default 0,
  arquivado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Equipamentos
create table equipamentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references contratos(id) on delete cascade,
  fabricante text,
  modelo text,
  serie text,
  ano integer,
  part_number text,
  localizacao text,
  foto_url text,
  arquivado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Peças por equipamento
create table pecas (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid references equipamentos(id) on delete cascade,
  descricao text not null,
  codigo text,
  unidade text default 'PC',
  tipo text,
  qtd_contratada numeric default 0,
  obs text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Visitas (apenas manutenção)
create table visitas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references contratos(id) on delete cascade,
  data date not null,
  os text not null,
  tipo text check (tipo in ('preventiva','corretiva')) default 'preventiva',
  horas numeric default 0,
  km numeric default 0,
  obs text,
  created_at timestamptz default now()
);

-- Baixas de peças
create table baixas (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid references pecas(id) on delete cascade,
  visita_id uuid references visitas(id) on delete set null,
  data date not null,
  os text not null,
  qtd numeric not null,
  re_nf text,
  created_at timestamptz default now()
);

-- Índices úteis
create index on contratos(cliente_id);
create index on equipamentos(contrato_id);
create index on pecas(equipamento_id);
create index on visitas(contrato_id);
create index on baixas(peca_id);
create index on baixas(visita_id);

-- RLS (Row Level Security) — habilitar após configurar auth
-- alter table clientes enable row level security;
-- alter table contratos enable row level security;
-- alter table equipamentos enable row level security;
-- alter table pecas enable row level security;
-- alter table visitas enable row level security;
-- alter table baixas enable row level security;
