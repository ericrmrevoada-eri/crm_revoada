-- Rastreia alterações sensíveis (ex: edição de preço, exclusão de produto, fechamento de caixa).
create table public.log_auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete set null,
  acao text not null,
  tabela_afetada text not null,
  registro_id uuid,
  criado_em timestamptz not null default now()
);
create index idx_log_auditoria_tabela_data on public.log_auditoria(tabela_afetada, criado_em);
create index idx_log_auditoria_usuario on public.log_auditoria(usuario_id);
