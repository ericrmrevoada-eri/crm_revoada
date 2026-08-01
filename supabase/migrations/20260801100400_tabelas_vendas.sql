create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.profiles(id) on delete restrict,
  status status_venda not null default 'concluida',
  forma_pagamento forma_pagamento not null,
  valor_total numeric(10,2) not null default 0 check (valor_total >= 0),
  desconto numeric(10,2) not null default 0 check (desconto >= 0),
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_vendas_vendedor on public.vendas(vendedor_id);
create index idx_vendas_criado_em on public.vendas(criado_em);
create index idx_vendas_status on public.vendas(status);

create table public.itens_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  variacao_produto_id uuid not null references public.variacoes_produto(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  preco_unitario_praticado numeric(10,2) not null check (preco_unitario_praticado >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_itens_venda_venda on public.itens_venda(venda_id);
create index idx_itens_venda_variacao on public.itens_venda(variacao_produto_id);

-- Detalha o split de pagamento quando vendas.forma_pagamento = 'misto'.
create table public.pagamentos_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  forma_pagamento forma_pagamento not null,
  valor numeric(10,2) not null check (valor > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_pagamentos_venda_venda on public.pagamentos_venda(venda_id);
