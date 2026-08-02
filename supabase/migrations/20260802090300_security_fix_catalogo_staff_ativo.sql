-- Correção de segurança (achado #4 do HANDOFF_SEGURANCA.md).
--
-- produtos_select_authenticated / categorias_select_authenticated /
-- variacoes_produto_select_authenticated liberavam leitura para qualquer
-- sessão autenticada (auth.uid() is not null), não só funcionário ativo —
-- isso inclui um vendedor desativado cujo token ainda não expirou (ver
-- achado #5) e, se o autocadastro estiver ligado no projeto hospedado,
-- qualquer pessoa que crie conta.
create or replace function private.is_staff_ativo()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and ativo = true
  );
$$;

revoke execute on function private.is_staff_ativo() from public;
grant execute on function private.is_staff_ativo() to authenticated, service_role;

drop policy "produtos_select_authenticated" on public.produtos;
create policy "produtos_select_authenticated" on public.produtos
  for select using ((select private.is_staff_ativo()));

drop policy "categorias_select_authenticated" on public.categorias;
create policy "categorias_select_authenticated" on public.categorias
  for select using ((select private.is_staff_ativo()));

drop policy "variacoes_produto_select_authenticated" on public.variacoes_produto;
create policy "variacoes_produto_select_authenticated" on public.variacoes_produto
  for select using ((select private.is_staff_ativo()));

-- fornecedores: só é usado em tela admin-only (entrada de estoque);
-- fornecedores_admin_all já cobre o acesso do admin. Vendedor não precisa
-- disso, então a policy some em vez de virar "staff ativo".
drop policy "fornecedores_select_authenticated" on public.fornecedores;

-- preco_custo (margem/custo) não deve ser legível pela sessão normal do
-- vendedor. listarProdutos() (admin-only) passa a usar o client de
-- service_role, que ignora esse grant.
--
-- O grant original (20260801101000_grants.sql) é table-level ("grant select
-- ... on all tables ... to authenticated"), que autoriza ler qualquer coluna
-- independente de um "revoke select (coluna)" pontual — por isso o grant
-- table-level precisa ser revogado e reconcedido só nas colunas liberadas.
revoke select on public.produtos from authenticated;
grant select (
  id, nome, descricao, categoria_id, fornecedor_id, marca,
  preco_venda, foto_url, ativo, created_at, updated_at
) on public.produtos to authenticated;
