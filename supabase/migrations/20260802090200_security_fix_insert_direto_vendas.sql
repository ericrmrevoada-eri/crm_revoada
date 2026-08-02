-- Correção de segurança (achado #3 do HANDOFF_SEGURANCA.md).
--
-- vendas_vendedor_insert_own / itens_venda_vendedor_insert_own permitiam
-- INSERT direto via REST sem passar por registrar_venda() — um vendedor
-- podia inflar o próprio desempenho (POST /rest/v1/vendas com valor_total
-- qualquer) sem baixar estoque, sem pagamento e sem checagem de caixa
-- aberto. Confirmado que o app nunca insere direto em vendas/itens_venda
-- (só via supabase.rpc("registrar_venda", ...)) — essas policies de INSERT
-- não têm uso legítimo.
--
-- pagamentos_venda_vendedor_insert_own tem o mesmo problema (não estava no
-- handoff original, mas é a mesma categoria: confirmado que o app também
-- nunca insere direto em pagamentos_venda) — incluída aqui pela mesma razão.
--
-- movimentacoes_caixa_vendedor_insert_own É usada para inserção direta
-- legítima (sangria/suprimento, em registrarMovimentacao()), mas sem
-- restrição de tipo/venda_id/despesa_id um vendedor podia inserir uma
-- movimentação tipo 'despesa' sem despesa_id correspondente, fazendo
-- dinheiro "sumir" do calculado no fechamento sem aparecer no relatório de
-- despesas. O Zod (movimentacaoCaixaSchema) já restringe a "sangria" |
-- "suprimento" — a RLS agora impõe a mesma regra.

drop policy "vendas_vendedor_insert_own" on public.vendas;
drop policy "itens_venda_vendedor_insert_own" on public.itens_venda;
drop policy "pagamentos_venda_vendedor_insert_own" on public.pagamentos_venda;

revoke insert on public.vendas from authenticated;
revoke insert on public.itens_venda from authenticated;
revoke insert on public.pagamentos_venda from authenticated;

drop policy "movimentacoes_caixa_vendedor_insert_own" on public.movimentacoes_caixa;
create policy "movimentacoes_caixa_vendedor_insert_own" on public.movimentacoes_caixa
  for insert with check (
    tipo in ('sangria', 'suprimento')
    and venda_id is null
    and despesa_id is null
    and exists (
      select 1 from public.caixas c
       where c.id = movimentacoes_caixa.caixa_id
         and c.vendedor_id = auth.uid()
         and c.status = 'aberto'
    )
  );
