-- Fase 4 — PDV e Financeiro/Caixa.
--
-- Duas coisas acontecem aqui:
--   1) ligações que faltavam entre venda, caixa e despesa — sem elas o fechamento
--      de caixa não consegue separar o que entrou em dinheiro na gaveta do que
--      entrou no cartão/Pix;
--   2) as funções transacionais que o PDV chama. Toda mutação sensível (baixa de
--      estoque, fechamento, cancelamento) roda numa função só, dentro de uma única
--      transação, para não existir estado pela metade.

-- ---------------------------------------------------------------------------
-- Ligações
-- ---------------------------------------------------------------------------

alter table public.vendas
  add column caixa_id uuid references public.caixas(id) on delete restrict;
create index idx_vendas_caixa on public.vendas(caixa_id);

-- Cada venda gera uma movimentação POR forma de pagamento (não uma pelo total):
-- o valor calculado no fechamento é abertura + vendas em DINHEIRO + suprimentos
-- - sangrias - despesas, então a forma de pagamento precisa estar na movimentação.
alter table public.movimentacoes_caixa
  add column venda_id uuid references public.vendas(id) on delete cascade,
  add column despesa_id uuid references public.despesas(id) on delete cascade,
  add column forma_pagamento forma_pagamento;
create index idx_movimentacoes_caixa_venda on public.movimentacoes_caixa(venda_id);
create index idx_movimentacoes_caixa_despesa on public.movimentacoes_caixa(despesa_id);

-- pagamentos_venda passa a receber uma linha por forma em TODA venda, não só nas
-- mistas — deixa os relatórios da Fase 5 com uma origem única de verdade sobre
-- faturamento por forma de pagamento.
comment on table public.pagamentos_venda is
  'Uma linha por forma de pagamento usada na venda. Vendas de forma única têm exatamente uma linha; vendas mistas têm duas ou mais.';

-- ---------------------------------------------------------------------------
-- registrar_venda — coração do PDV
-- ---------------------------------------------------------------------------
--
-- p_itens:      [{"variacao_id": uuid, "quantidade": int, "preco_unitario": numeric}, ...]
-- p_pagamentos: [{"forma": forma_pagamento, "valor": numeric}, ...]
--
-- SECURITY DEFINER porque a função escreve em log_auditoria, que de propósito não
-- tem policy de insert para ninguém. Mesmo assim ela nunca confia no chamador:
-- resolve o vendedor por auth.uid() e ignora qualquer id vindo de fora.
create or replace function public.registrar_venda(
  p_itens jsonb,
  p_pagamentos jsonb,
  p_desconto numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caixa_id uuid;
  v_venda_id uuid;
  v_desconto numeric(10,2) := round(coalesce(p_desconto, 0), 2);
  v_bruto numeric(10,2) := 0;
  v_total numeric(10,2);
  v_pago numeric(10,2);
  v_formas integer;
  v_forma forma_pagamento;
  v_item record;
  v_estoque integer;
  v_rotulo text;
begin
  if v_uid is null then
    raise exception 'NAO_AUTENTICADO';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid and ativo = true) then
    raise exception 'CONTA_INATIVA';
  end if;

  -- Regra de negócio: ninguém vende sem caixa aberto (admin incluído).
  select id into v_caixa_id
    from public.caixas
   where vendedor_id = v_uid and status = 'aberto';
  if v_caixa_id is null then
    raise exception 'CAIXA_FECHADO';
  end if;

  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'CARRINHO_VAZIO';
  end if;

  if p_pagamentos is null or jsonb_array_length(p_pagamentos) = 0 then
    raise exception 'PAGAMENTO_AUSENTE';
  end if;

  if v_desconto < 0 then
    raise exception 'DESCONTO_INVALIDO';
  end if;

  -- Trava as variações antes de conferir estoque. O "order by" garante ordem
  -- determinística de lock: dois PDVs vendendo as mesmas peças ao mesmo tempo
  -- entram em fila em vez de deadlock.
  for v_item in
    select (i->>'variacao_id')::uuid as variacao_id,
           sum((i->>'quantidade')::integer) as quantidade,
           max((i->>'preco_unitario')::numeric) as preco_unitario
      from jsonb_array_elements(p_itens) i
     group by (i->>'variacao_id')::uuid
     order by (i->>'variacao_id')::uuid
  loop
    if v_item.quantidade <= 0 or v_item.preco_unitario < 0 then
      raise exception 'ITEM_INVALIDO';
    end if;

    select v.quantidade_estoque, p.nome || ' ' || v.tamanho || '/' || v.cor
      into v_estoque, v_rotulo
      from public.variacoes_produto v
      join public.produtos p on p.id = v.produto_id
     where v.id = v_item.variacao_id
     for update of v;

    if not found then
      raise exception 'VARIACAO_INEXISTENTE';
    end if;

    if v_estoque < v_item.quantidade then
      raise exception 'ESTOQUE_INSUFICIENTE:%', v_rotulo;
    end if;

    v_bruto := v_bruto + (v_item.quantidade * v_item.preco_unitario);
  end loop;

  v_total := round(v_bruto - v_desconto, 2);
  if v_total < 0 then
    raise exception 'DESCONTO_MAIOR_QUE_TOTAL';
  end if;

  select round(coalesce(sum((pg->>'valor')::numeric), 0), 2),
         count(distinct pg->>'forma')
    into v_pago, v_formas
    from jsonb_array_elements(p_pagamentos) pg;

  -- Tolerância de 1 centavo: divisão de valor misto arredonda no cliente.
  if abs(v_pago - v_total) > 0.01 then
    raise exception 'PAGAMENTO_DIVERGENTE';
  end if;

  if v_formas = 1 then
    select (pg->>'forma')::forma_pagamento into v_forma
      from jsonb_array_elements(p_pagamentos) pg limit 1;
  else
    v_forma := 'misto';
  end if;

  insert into public.vendas (vendedor_id, caixa_id, status, forma_pagamento, valor_total, desconto)
  values (v_uid, v_caixa_id, 'concluida', v_forma, v_total, v_desconto)
  returning id into v_venda_id;

  insert into public.itens_venda (
    venda_id, variacao_produto_id, quantidade, preco_unitario_praticado, subtotal
  )
  select v_venda_id,
         (i->>'variacao_id')::uuid,
         sum((i->>'quantidade')::integer),
         max((i->>'preco_unitario')::numeric),
         round(sum((i->>'quantidade')::integer) * max((i->>'preco_unitario')::numeric), 2)
    from jsonb_array_elements(p_itens) i
   group by (i->>'variacao_id')::uuid;

  update public.variacoes_produto v
     set quantidade_estoque = v.quantidade_estoque - agg.quantidade
    from (
      select (i->>'variacao_id')::uuid as variacao_id,
             sum((i->>'quantidade')::integer) as quantidade
        from jsonb_array_elements(p_itens) i
       group by (i->>'variacao_id')::uuid
    ) agg
   where v.id = agg.variacao_id;

  insert into public.pagamentos_venda (venda_id, forma_pagamento, valor)
  select v_venda_id,
         (pg->>'forma')::forma_pagamento,
         round(sum((pg->>'valor')::numeric), 2)
    from jsonb_array_elements(p_pagamentos) pg
   group by (pg->>'forma')::forma_pagamento;

  insert into public.movimentacoes_caixa (
    caixa_id, tipo, valor, descricao, venda_id, forma_pagamento
  )
  select v_caixa_id, 'venda', pv.valor, 'Venda no PDV', v_venda_id, pv.forma_pagamento
    from public.pagamentos_venda pv
   where pv.venda_id = v_venda_id;

  -- Desconto é livre para o vendedor, mas sempre auditado.
  if v_desconto > 0 then
    insert into public.log_auditoria (usuario_id, acao, tabela_afetada, registro_id)
    values (
      v_uid,
      format('desconto de R$ %s aplicado na venda', to_char(v_desconto, 'FM999999990.00')),
      'vendas',
      v_venda_id
    );
  end if;

  return v_venda_id;
end;
$$;

revoke execute on function public.registrar_venda(jsonb, jsonb, numeric) from public;
grant execute on function public.registrar_venda(jsonb, jsonb, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- resumo_caixa — valor calculado da gaveta
-- ---------------------------------------------------------------------------
--
-- Usada tanto pela tela de fechamento (mostrar o esperado antes de confirmar)
-- quanto por fechar_caixa (gravar o calculado). Uma fórmula só, um lugar só.
create or replace function public.resumo_caixa(p_caixa_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caixa public.caixas;
  v_vendas_dinheiro numeric(10,2);
  v_vendas_outras numeric(10,2);
  v_suprimentos numeric(10,2);
  v_sangrias numeric(10,2);
  v_despesas numeric(10,2);
begin
  if v_uid is null then
    raise exception 'NAO_AUTENTICADO';
  end if;

  select * into v_caixa from public.caixas where id = p_caixa_id;
  if not found then
    raise exception 'CAIXA_INEXISTENTE';
  end if;

  -- Vendedor só enxerga o próprio caixa; admin enxerga qualquer um.
  if v_caixa.vendedor_id <> v_uid and not private.is_admin() then
    raise exception 'SEM_PERMISSAO';
  end if;

  select
    coalesce(sum(valor) filter (where tipo = 'venda' and forma_pagamento = 'dinheiro'), 0),
    coalesce(sum(valor) filter (where tipo = 'venda' and forma_pagamento <> 'dinheiro'), 0),
    coalesce(sum(valor) filter (where tipo = 'suprimento'), 0),
    coalesce(sum(valor) filter (where tipo = 'sangria'), 0),
    coalesce(sum(valor) filter (where tipo = 'despesa'), 0)
  into v_vendas_dinheiro, v_vendas_outras, v_suprimentos, v_sangrias, v_despesas
  from public.movimentacoes_caixa
  where caixa_id = p_caixa_id;

  return jsonb_build_object(
    'caixa_id', p_caixa_id,
    'valor_abertura', v_caixa.valor_abertura,
    'vendas_dinheiro', v_vendas_dinheiro,
    'vendas_outras', v_vendas_outras,
    'suprimentos', v_suprimentos,
    'sangrias', v_sangrias,
    'despesas', v_despesas,
    'valor_calculado',
      round(v_caixa.valor_abertura + v_vendas_dinheiro + v_suprimentos - v_sangrias - v_despesas, 2)
  );
end;
$$;

revoke execute on function public.resumo_caixa(uuid) from public;
grant execute on function public.resumo_caixa(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- fechar_caixa
-- ---------------------------------------------------------------------------
create or replace function public.fechar_caixa(
  p_caixa_id uuid,
  p_valor_informado numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caixa public.caixas;
  v_resumo jsonb;
  v_calculado numeric(10,2);
  v_informado numeric(10,2) := round(coalesce(p_valor_informado, 0), 2);
begin
  if v_uid is null then
    raise exception 'NAO_AUTENTICADO';
  end if;

  if v_informado < 0 then
    raise exception 'VALOR_INVALIDO';
  end if;

  -- FOR UPDATE evita dois fechamentos concorrentes do mesmo caixa.
  select * into v_caixa from public.caixas where id = p_caixa_id for update;
  if not found then
    raise exception 'CAIXA_INEXISTENTE';
  end if;

  if v_caixa.vendedor_id <> v_uid and not private.is_admin() then
    raise exception 'SEM_PERMISSAO';
  end if;

  if v_caixa.status = 'fechado' then
    raise exception 'CAIXA_JA_FECHADO';
  end if;

  v_resumo := public.resumo_caixa(p_caixa_id);
  v_calculado := (v_resumo->>'valor_calculado')::numeric;

  update public.caixas
     set status = 'fechado',
         data_fechamento = now(),
         valor_fechamento_informado = v_informado,
         valor_fechamento_calculado = v_calculado
   where id = p_caixa_id;

  insert into public.log_auditoria (usuario_id, acao, tabela_afetada, registro_id)
  values (
    v_uid,
    format(
      'caixa fechado — informado R$ %s, calculado R$ %s (diferença R$ %s)',
      to_char(v_informado, 'FM999999990.00'),
      to_char(v_calculado, 'FM999999990.00'),
      to_char(v_informado - v_calculado, 'FM999999990.00')
    ),
    'caixas',
    p_caixa_id
  );

  return v_resumo || jsonb_build_object(
    'valor_informado', v_informado,
    'diferenca', round(v_informado - v_calculado, 2)
  );
end;
$$;

revoke execute on function public.fechar_caixa(uuid, numeric) from public;
grant execute on function public.fechar_caixa(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- cancelar_venda — só admin, e só enquanto o caixa estiver aberto
-- ---------------------------------------------------------------------------
--
-- Cancelar depois do fechamento invalidaria um caixa já conferido e assinado, por
-- isso a função recusa. Nesse caso o ajuste é uma despesa/entrada de estoque
-- explícita, que fica rastreável.
create or replace function public.cancelar_venda(p_venda_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_venda public.vendas;
  v_status_caixa status_caixa;
begin
  if v_uid is null then
    raise exception 'NAO_AUTENTICADO';
  end if;

  if not private.is_admin() then
    raise exception 'SEM_PERMISSAO';
  end if;

  select * into v_venda from public.vendas where id = p_venda_id for update;
  if not found then
    raise exception 'VENDA_INEXISTENTE';
  end if;

  if v_venda.status = 'cancelada' then
    raise exception 'VENDA_JA_CANCELADA';
  end if;

  if v_venda.caixa_id is not null then
    select status into v_status_caixa from public.caixas where id = v_venda.caixa_id;
    if v_status_caixa = 'fechado' then
      raise exception 'CAIXA_JA_FECHADO';
    end if;
  end if;

  -- Estoque volta para a prateleira.
  update public.variacoes_produto v
     set quantidade_estoque = v.quantidade_estoque + agg.quantidade
    from (
      select variacao_produto_id, sum(quantidade) as quantidade
        from public.itens_venda
       where venda_id = p_venda_id
       group by variacao_produto_id
    ) agg
   where v.id = agg.variacao_produto_id;

  -- A movimentação sai do caixa em vez de virar lançamento negativo: a coluna
  -- valor tem check (valor >= 0), e um caixa aberto ainda não foi conferido.
  delete from public.movimentacoes_caixa where venda_id = p_venda_id;

  update public.vendas set status = 'cancelada' where id = p_venda_id;

  insert into public.log_auditoria (usuario_id, acao, tabela_afetada, registro_id)
  values (
    v_uid,
    format('venda cancelada com estorno de estoque — R$ %s',
           to_char(v_venda.valor_total, 'FM999999990.00')),
    'vendas',
    p_venda_id
  );
end;
$$;

revoke execute on function public.cancelar_venda(uuid) from public;
grant execute on function public.cancelar_venda(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- registrar_despesa
-- ---------------------------------------------------------------------------
--
-- Despesa paga com dinheiro da gaveta precisa sair do caixa também; as duas
-- escritas ficam na mesma transação. p_caixa_id nulo = despesa paga por fora
-- (transferência, boleto), que entra só no resumo financeiro.
create or replace function public.registrar_despesa(
  p_categoria categoria_despesa,
  p_valor numeric,
  p_descricao text default null,
  p_data date default current_date,
  p_caixa_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_despesa_id uuid;
  v_valor numeric(10,2) := round(coalesce(p_valor, 0), 2);
  v_status_caixa status_caixa;
begin
  if v_uid is null then
    raise exception 'NAO_AUTENTICADO';
  end if;

  if not private.is_admin() then
    raise exception 'SEM_PERMISSAO';
  end if;

  if v_valor <= 0 then
    raise exception 'VALOR_INVALIDO';
  end if;

  insert into public.despesas (categoria, descricao, valor, data, criado_por)
  values (p_categoria, nullif(btrim(coalesce(p_descricao, '')), ''), v_valor,
          coalesce(p_data, current_date), v_uid)
  returning id into v_despesa_id;

  if p_caixa_id is not null then
    select status into v_status_caixa from public.caixas where id = p_caixa_id;
    if not found then
      raise exception 'CAIXA_INEXISTENTE';
    end if;
    if v_status_caixa = 'fechado' then
      raise exception 'CAIXA_JA_FECHADO';
    end if;

    insert into public.movimentacoes_caixa (caixa_id, tipo, valor, descricao, despesa_id)
    values (p_caixa_id, 'despesa', v_valor,
            coalesce(nullif(btrim(coalesce(p_descricao, '')), ''), p_categoria::text),
            v_despesa_id);
  end if;

  return v_despesa_id;
end;
$$;

revoke execute on function public.registrar_despesa(categoria_despesa, numeric, text, date, uuid) from public;
grant execute on function public.registrar_despesa(categoria_despesa, numeric, text, date, uuid) to authenticated;
