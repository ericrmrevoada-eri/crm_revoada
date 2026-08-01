create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  categoria_id uuid references public.categorias(id) on delete set null,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  marca text,
  preco_custo numeric(10,2) not null default 0 check (preco_custo >= 0),
  preco_venda numeric(10,2) not null default 0 check (preco_venda >= 0),
  foto_url text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_produtos_categoria on public.produtos(categoria_id);
create index idx_produtos_fornecedor on public.produtos(fornecedor_id);
create index idx_produtos_marca on public.produtos(marca);
create index idx_produtos_ativo on public.produtos(ativo);
create index idx_produtos_nome_trgm on public.produtos using gin (nome gin_trgm_ops);

-- Variações por tamanho x cor. Estoque nunca negativo.
create table public.variacoes_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  tamanho text not null,
  cor text not null,
  quantidade_estoque integer not null default 0 check (quantidade_estoque >= 0),
  estoque_minimo integer not null default 0 check (estoque_minimo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (produto_id, tamanho, cor)
);
create index idx_variacoes_produto_produto on public.variacoes_produto(produto_id);
create index idx_variacoes_baixo_estoque on public.variacoes_produto(quantidade_estoque, estoque_minimo);

-- Histórico de entradas de mercadoria (reposição), vinculado a fornecedor/lote.
create table public.entradas_estoque (
  id uuid primary key default gen_random_uuid(),
  variacao_produto_id uuid not null references public.variacoes_produto(id) on delete cascade,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  quantidade integer not null check (quantidade > 0),
  lote text,
  data_entrada date not null default current_date,
  criado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_entradas_estoque_variacao on public.entradas_estoque(variacao_produto_id);
create index idx_entradas_estoque_fornecedor on public.entradas_estoque(fornecedor_id);
create index idx_entradas_estoque_data on public.entradas_estoque(data_entrada);
