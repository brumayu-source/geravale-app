-- Garante que arquivado tenha default false em todas as tabelas
-- Execute no SQL Editor do Supabase

alter table clientes alter column arquivado set default false;
alter table clientes alter column arquivado set not null;
update clientes set arquivado = false where arquivado is null;

alter table contratos alter column arquivado set default false;
alter table contratos alter column arquivado set not null;
update contratos set arquivado = false where arquivado is null;

alter table equipamentos alter column arquivado set default false;
alter table equipamentos alter column arquivado set not null;
update equipamentos set arquivado = false where arquivado is null;
