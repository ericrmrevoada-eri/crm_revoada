-- Correção de segurança (achado F1 da auditoria automatizada).
--
-- 20260802090100_security_fix_caixa_sem_update_direto.sql fechou o PATCH
-- direto em `caixas`, mas deixou aberta a mesma forja pelo caminho do INSERT:
-- "caixas_vendedor_insert_own" só exigia posse da linha (vendedor_id =
-- auth.uid()) e nenhuma outra coluna, então um vendedor autenticado podia
-- POSTar em /rest/v1/caixas uma linha já nascida com status = 'fechado',
-- data_fechamento/valor_fechamento_informado/valor_fechamento_calculado
-- escolhidos a dedo (e data_abertura arbitrária) — um fechamento "sem
-- divergência" que fechar_caixa() nunca calculou e que não deixa registro em
-- log_auditoria. O índice parcial uniq_caixa_aberto_por_vendedor só cobre
-- status = 'aberto', então essas linhas 'fechado' entravam sem limite, e
-- listarCaixas() as exibe como conferidas na tela do admin.
--
-- O app só tem um caminho legítimo de INSERT em `caixas`: abrirCaixa()
-- (actions/caixa.ts) manda exatamente { vendedor_id, valor_abertura }. Todas
-- as colunas de fechamento são preenchidas apenas por fechar_caixa()
-- (security definer, que calcula o valor e audita). Logo a policy pode fixar
-- tudo o que é do servidor sem mudar nada na aplicação:
--
--   * status = 'aberto' — caixa nasce aberto, sempre;
--   * data_fechamento / valor_fechamento_informado / valor_fechamento_calculado
--     nulos — quem preenche é fechar_caixa();
--   * data_abertura = now() — o app nunca envia essa coluna, o default da
--     tabela é now() e o default e o WITH CHECK são avaliados na mesma
--     transação (now() = transaction_timestamp()), então o INSERT do app
--     passa. O efeito é que um data_abertura vindo do cliente (única forma de
--     backdatar/futuredatar uma sessão de caixa) passa a ser recusado. Se
--     algum dia a abertura precisar mandar a data explicitamente, esta linha
--     é a que precisa ser afrouxada.
--
-- auth.uid() envolvido em (select ...) pelo mesmo motivo de performance de
-- 20260801101200_perf_hardening.sql (initplan, avaliado uma vez por query).
-- A policy "caixas_admin_all" continua valendo à parte (policies permissivas
-- são OR), então o admin não é afetado.
drop policy if exists "caixas_vendedor_insert_own" on public.caixas;
create policy "caixas_vendedor_insert_own" on public.caixas
  for insert with check (
    vendedor_id = (select auth.uid())
    and status = 'aberto'
    and data_abertura = now()
    and data_fechamento is null
    and valor_fechamento_informado is null
    and valor_fechamento_calculado is null
  );

-- A mesma invariante gravada no schema, para valer independente de quem
-- escreve (policy de admin, service_role, editor do dashboard): caixa aberto
-- não tem dados de fechamento; caixa fechado tem os três. Confere com os dois
-- caminhos legítimos: na abertura as três colunas ficam nulas (não têm default)
-- e no fechamento fechar_caixa() grava as três de uma vez — data_fechamento =
-- now(), valor_fechamento_informado = round(coalesce(p_valor_informado, 0), 2)
-- e valor_fechamento_calculado = resumo_caixa()->>'valor_calculado', que é
-- round() sobre valor_abertura (not null) mais somas com coalesce(..., 0),
-- portanto nunca nulo. status é not null e o enum status_caixa só tem
-- 'aberto'/'fechado', então os dois braços cobrem todos os casos.
--
-- Entra como NOT VALID de propósito: linhas antigas inconsistentes podem
-- existir em produção (justamente as forjadas por este achado, ou por
-- "caixas_vendedor_update_own" enquanto ela existiu, que permitia gravar
-- status = 'fechado' sem as colunas de fechamento). Validar agora faria o
-- deploy da migration falhar em cima desse histórico, e decidir o que fazer
-- com uma linha forjada (apagar? corrigir? investigar o vendedor?) é do dono
-- do sistema, não desta migration. NOT VALID já impõe a regra em todo INSERT
-- e UPDATE a partir daqui.
--
-- Para auditar o histórico e, se estiver limpo, passar a constraint a
-- validada:
--   select id, vendedor_id, status, data_fechamento,
--          valor_fechamento_informado, valor_fechamento_calculado
--     from public.caixas
--    where (status = 'aberto') <> (data_fechamento is null
--                                  and valor_fechamento_informado is null
--                                  and valor_fechamento_calculado is null);
--   alter table public.caixas validate constraint caixas_fechamento_consistente;
alter table public.caixas drop constraint if exists caixas_fechamento_consistente;
alter table public.caixas
  add constraint caixas_fechamento_consistente check (
    (
      status = 'aberto'
      and data_fechamento is null
      and valor_fechamento_informado is null
      and valor_fechamento_calculado is null
    )
    or (
      status = 'fechado'
      and data_fechamento is not null
      and valor_fechamento_informado is not null
      and valor_fechamento_calculado is not null
    )
  ) not valid;
