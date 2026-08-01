-- Correções apontadas pelo advisor de performance do Supabase.

-- 1) FKs de auditoria (criado_por) sem índice de cobertura.
create index idx_despesas_criado_por on public.despesas(criado_por);
create index idx_entradas_estoque_criado_por on public.entradas_estoque(criado_por);

-- 2) `auth.uid()` / `private.is_admin()` chamados diretamente numa policy são
-- reavaliados linha a linha; envolver em `(select ...)` deixa o Postgres resolver
-- uma vez só por query (initplan). Reaplica todas as policies com essa forma.

alter policy "profiles_admin_all" on public.profiles
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "profiles_self_select" on public.profiles
  using (id = (select auth.uid()));

alter policy "categorias_admin_all" on public.categorias
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "categorias_select_authenticated" on public.categorias
  using ((select auth.uid()) is not null);

alter policy "fornecedores_admin_all" on public.fornecedores
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "fornecedores_select_authenticated" on public.fornecedores
  using ((select auth.uid()) is not null);

alter policy "produtos_admin_all" on public.produtos
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "produtos_select_authenticated" on public.produtos
  using ((select auth.uid()) is not null);

alter policy "variacoes_produto_admin_all" on public.variacoes_produto
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "variacoes_produto_select_authenticated" on public.variacoes_produto
  using ((select auth.uid()) is not null);

alter policy "entradas_estoque_admin_all" on public.entradas_estoque
  using ((select private.is_admin())) with check ((select private.is_admin()));

alter policy "vendas_admin_all" on public.vendas
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "vendas_vendedor_select_own" on public.vendas
  using (vendedor_id = (select auth.uid()));
alter policy "vendas_vendedor_insert_own" on public.vendas
  with check (vendedor_id = (select auth.uid()));

alter policy "itens_venda_admin_all" on public.itens_venda
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "itens_venda_vendedor_select_own" on public.itens_venda
  using (
    exists (select 1 from public.vendas v where v.id = itens_venda.venda_id and v.vendedor_id = (select auth.uid()))
  );
alter policy "itens_venda_vendedor_insert_own" on public.itens_venda
  with check (
    exists (select 1 from public.vendas v where v.id = itens_venda.venda_id and v.vendedor_id = (select auth.uid()))
  );

alter policy "pagamentos_venda_admin_all" on public.pagamentos_venda
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "pagamentos_venda_vendedor_select_own" on public.pagamentos_venda
  using (
    exists (select 1 from public.vendas v where v.id = pagamentos_venda.venda_id and v.vendedor_id = (select auth.uid()))
  );
alter policy "pagamentos_venda_vendedor_insert_own" on public.pagamentos_venda
  with check (
    exists (select 1 from public.vendas v where v.id = pagamentos_venda.venda_id and v.vendedor_id = (select auth.uid()))
  );

alter policy "caixas_admin_all" on public.caixas
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "caixas_vendedor_select_own" on public.caixas
  using (vendedor_id = (select auth.uid()));
alter policy "caixas_vendedor_insert_own" on public.caixas
  with check (vendedor_id = (select auth.uid()));
alter policy "caixas_vendedor_update_own" on public.caixas
  using (vendedor_id = (select auth.uid())) with check (vendedor_id = (select auth.uid()));

alter policy "movimentacoes_caixa_admin_all" on public.movimentacoes_caixa
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "movimentacoes_caixa_vendedor_select_own" on public.movimentacoes_caixa
  using (
    exists (select 1 from public.caixas c where c.id = movimentacoes_caixa.caixa_id and c.vendedor_id = (select auth.uid()))
  );
alter policy "movimentacoes_caixa_vendedor_insert_own" on public.movimentacoes_caixa
  with check (
    exists (select 1 from public.caixas c where c.id = movimentacoes_caixa.caixa_id and c.vendedor_id = (select auth.uid()))
  );

alter policy "despesas_admin_all" on public.despesas
  using ((select private.is_admin())) with check ((select private.is_admin()));

alter policy "log_auditoria_admin_select" on public.log_auditoria
  using ((select private.is_admin()));

alter policy "produtos_admin_select" on storage.objects
  using (bucket_id = 'produtos' and (select private.is_admin()));
alter policy "produtos_admin_insert" on storage.objects
  with check (bucket_id = 'produtos' and (select private.is_admin()));
alter policy "produtos_admin_update" on storage.objects
  using (bucket_id = 'produtos' and (select private.is_admin()))
  with check (bucket_id = 'produtos' and (select private.is_admin()));
alter policy "produtos_admin_delete" on storage.objects
  using (bucket_id = 'produtos' and (select private.is_admin()));
