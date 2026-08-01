-- Mantém updated_at em dia em qualquer UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_categorias_updated_at before update on public.categorias for each row execute function public.set_updated_at();
create trigger trg_fornecedores_updated_at before update on public.fornecedores for each row execute function public.set_updated_at();
create trigger trg_produtos_updated_at before update on public.produtos for each row execute function public.set_updated_at();
create trigger trg_variacoes_produto_updated_at before update on public.variacoes_produto for each row execute function public.set_updated_at();
create trigger trg_entradas_estoque_updated_at before update on public.entradas_estoque for each row execute function public.set_updated_at();
create trigger trg_vendas_updated_at before update on public.vendas for each row execute function public.set_updated_at();
create trigger trg_itens_venda_updated_at before update on public.itens_venda for each row execute function public.set_updated_at();
create trigger trg_pagamentos_venda_updated_at before update on public.pagamentos_venda for each row execute function public.set_updated_at();
create trigger trg_caixas_updated_at before update on public.caixas for each row execute function public.set_updated_at();
create trigger trg_movimentacoes_caixa_updated_at before update on public.movimentacoes_caixa for each row execute function public.set_updated_at();
create trigger trg_despesas_updated_at before update on public.despesas for each row execute function public.set_updated_at();

-- Checagem de papel usada nas policies de RLS. SECURITY DEFINER evita recursão de RLS
-- ao ler a própria tabela profiles a partir das policies de outras tabelas.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and papel = 'admin' and ativo = true
  );
$$;

-- Toda entrada de mercadoria incrementa automaticamente o estoque da variação.
create or replace function public.aplicar_entrada_estoque()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.variacoes_produto
  set quantidade_estoque = quantidade_estoque + new.quantidade
  where id = new.variacao_produto_id;
  return new;
end;
$$;

create trigger trg_entradas_estoque_aplicar
after insert on public.entradas_estoque
for each row execute function public.aplicar_entrada_estoque();
