-- Correção de segurança (achado #1 do HANDOFF_SEGURANCA.md).
--
-- registrar_venda calculava v_bruto a partir de `preco_unitario` vindo direto
-- do JSON enviado pelo chamador — qualquer sessão autenticada podia chamar o
-- RPC com um preço forjado (ex: R$ 0,01) e registrar uma venda por centavos,
-- com estoque baixado e caixa "batendo", sem deixar rastro em log_auditoria.
--
-- A partir de agora o preço nunca vem do cliente: só a quantidade por
-- variação é aceita, e o preço é sempre resolvido aqui a partir de
-- produtos.preco_venda, dentro da mesma trava (for update of v) que já
-- protegia o estoque.
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
  v_preco numeric(10,2);
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
           sum((i->>'quantidade')::integer) as quantidade
      from jsonb_array_elements(p_itens) i
     group by (i->>'variacao_id')::uuid
     order by (i->>'variacao_id')::uuid
  loop
    if v_item.quantidade <= 0 then
      raise exception 'ITEM_INVALIDO';
    end if;

    -- Preço sempre lido daqui, nunca do JSON do chamador.
    select v.quantidade_estoque, p.nome || ' ' || v.tamanho || '/' || v.cor, p.preco_venda
      into v_estoque, v_rotulo, v_preco
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

    v_bruto := v_bruto + (v_item.quantidade * v_preco);
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

  -- preco_unitario_praticado vem de produtos.preco_venda (join), não do JSON.
  insert into public.itens_venda (
    venda_id, variacao_produto_id, quantidade, preco_unitario_praticado, subtotal
  )
  select v_venda_id,
         agg.variacao_id,
         agg.quantidade,
         p.preco_venda,
         round(agg.quantidade * p.preco_venda, 2)
    from (
      select (i->>'variacao_id')::uuid as variacao_id,
             sum((i->>'quantidade')::integer) as quantidade
        from jsonb_array_elements(p_itens) i
       group by (i->>'variacao_id')::uuid
    ) agg
    join public.variacoes_produto v on v.id = agg.variacao_id
    join public.produtos p on p.id = v.produto_id;

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
revoke execute on function public.registrar_venda(jsonb, jsonb, numeric) from anon;
grant execute on function public.registrar_venda(jsonb, jsonb, numeric) to authenticated;
