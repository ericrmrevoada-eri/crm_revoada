alter table public.profiles enable row level security;
alter table public.categorias enable row level security;
alter table public.fornecedores enable row level security;
alter table public.produtos enable row level security;
alter table public.variacoes_produto enable row level security;
alter table public.entradas_estoque enable row level security;
alter table public.vendas enable row level security;
alter table public.itens_venda enable row level security;
alter table public.pagamentos_venda enable row level security;
alter table public.caixas enable row level security;
alter table public.movimentacoes_caixa enable row level security;
alter table public.despesas enable row level security;
alter table public.log_auditoria enable row level security;

-- profiles: admin enxerga/edita todos; vendedor só enxerga (e não edita) a própria linha.
-- Inserção/exclusão de vendedores é feita por Server Action com service_role (criação de
-- auth.users exige a Admin API, que só roda no servidor).
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());

-- categorias / fornecedores / produtos / variacoes_produto: admin — CRUD completo;
-- vendedor — somente leitura.
create policy "categorias_admin_all" on public.categorias
  for all using (public.is_admin()) with check (public.is_admin());
create policy "categorias_select_authenticated" on public.categorias
  for select using (auth.uid() is not null);

create policy "fornecedores_admin_all" on public.fornecedores
  for all using (public.is_admin()) with check (public.is_admin());
create policy "fornecedores_select_authenticated" on public.fornecedores
  for select using (auth.uid() is not null);

create policy "produtos_admin_all" on public.produtos
  for all using (public.is_admin()) with check (public.is_admin());
create policy "produtos_select_authenticated" on public.produtos
  for select using (auth.uid() is not null);

create policy "variacoes_produto_admin_all" on public.variacoes_produto
  for all using (public.is_admin()) with check (public.is_admin());
create policy "variacoes_produto_select_authenticated" on public.variacoes_produto
  for select using (auth.uid() is not null);

-- entradas_estoque: restrito ao admin (custo/reposição não é operacional de vendedor).
create policy "entradas_estoque_admin_all" on public.entradas_estoque
  for all using (public.is_admin()) with check (public.is_admin());

-- vendas: admin — tudo; vendedor — insere e enxerga apenas as próprias vendas.
create policy "vendas_admin_all" on public.vendas
  for all using (public.is_admin()) with check (public.is_admin());
create policy "vendas_vendedor_select_own" on public.vendas
  for select using (vendedor_id = auth.uid());
create policy "vendas_vendedor_insert_own" on public.vendas
  for insert with check (vendedor_id = auth.uid());

-- itens_venda / pagamentos_venda: acesso do vendedor via join na venda dona do item.
create policy "itens_venda_admin_all" on public.itens_venda
  for all using (public.is_admin()) with check (public.is_admin());
create policy "itens_venda_vendedor_select_own" on public.itens_venda
  for select using (
    exists (select 1 from public.vendas v where v.id = itens_venda.venda_id and v.vendedor_id = auth.uid())
  );
create policy "itens_venda_vendedor_insert_own" on public.itens_venda
  for insert with check (
    exists (select 1 from public.vendas v where v.id = itens_venda.venda_id and v.vendedor_id = auth.uid())
  );

create policy "pagamentos_venda_admin_all" on public.pagamentos_venda
  for all using (public.is_admin()) with check (public.is_admin());
create policy "pagamentos_venda_vendedor_select_own" on public.pagamentos_venda
  for select using (
    exists (select 1 from public.vendas v where v.id = pagamentos_venda.venda_id and v.vendedor_id = auth.uid())
  );
create policy "pagamentos_venda_vendedor_insert_own" on public.pagamentos_venda
  for insert with check (
    exists (select 1 from public.vendas v where v.id = pagamentos_venda.venda_id and v.vendedor_id = auth.uid())
  );

-- caixas: vendedor opera (abre/fecha/consulta) apenas o próprio caixa.
create policy "caixas_admin_all" on public.caixas
  for all using (public.is_admin()) with check (public.is_admin());
create policy "caixas_vendedor_select_own" on public.caixas
  for select using (vendedor_id = auth.uid());
create policy "caixas_vendedor_insert_own" on public.caixas
  for insert with check (vendedor_id = auth.uid());
create policy "caixas_vendedor_update_own" on public.caixas
  for update using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

-- movimentacoes_caixa: acesso do vendedor via join no caixa dono da movimentação.
create policy "movimentacoes_caixa_admin_all" on public.movimentacoes_caixa
  for all using (public.is_admin()) with check (public.is_admin());
create policy "movimentacoes_caixa_vendedor_select_own" on public.movimentacoes_caixa
  for select using (
    exists (select 1 from public.caixas c where c.id = movimentacoes_caixa.caixa_id and c.vendedor_id = auth.uid())
  );
create policy "movimentacoes_caixa_vendedor_insert_own" on public.movimentacoes_caixa
  for insert with check (
    exists (select 1 from public.caixas c where c.id = movimentacoes_caixa.caixa_id and c.vendedor_id = auth.uid())
  );

-- despesas: somente admin (custo consolidado da loja).
create policy "despesas_admin_all" on public.despesas
  for all using (public.is_admin()) with check (public.is_admin());

-- log_auditoria: leitura só para admin; escrita só via service_role/funções internas
-- (nenhuma policy de insert/update/delete é criada de propósito).
create policy "log_auditoria_admin_select" on public.log_auditoria
  for select using (public.is_admin());
