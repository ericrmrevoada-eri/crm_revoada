create table public.caixas (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.profiles(id) on delete restrict,
  data_abertura timestamptz not null default now(),
  valor_abertura numeric(10,2) not null default 0 check (valor_abertura >= 0),
  data_fechamento timestamptz,
  valor_fechamento_informado numeric(10,2),
  valor_fechamento_calculado numeric(10,2),
  status status_caixa not null default 'aberto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_caixas_vendedor_status on public.caixas(vendedor_id, status);
-- Garante no máximo um caixa aberto por vendedor por vez (regra de negócio do PDV).
create unique index uniq_caixa_aberto_por_vendedor on public.caixas(vendedor_id) where status = 'aberto';

create table public.movimentacoes_caixa (
  id uuid primary key default gen_random_uuid(),
  caixa_id uuid not null references public.caixas(id) on delete cascade,
  tipo tipo_movimentacao_caixa not null,
  valor numeric(10,2) not null check (valor >= 0),
  descricao text,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_movimentacoes_caixa_caixa on public.movimentacoes_caixa(caixa_id);
create index idx_movimentacoes_caixa_tipo on public.movimentacoes_caixa(tipo);

create table public.despesas (
  id uuid primary key default gen_random_uuid(),
  categoria categoria_despesa not null,
  descricao text,
  valor numeric(10,2) not null check (valor > 0),
  data date not null default current_date,
  criado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_despesas_data on public.despesas(data);
create index idx_despesas_categoria on public.despesas(categoria);
