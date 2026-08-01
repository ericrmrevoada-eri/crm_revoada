-- Fase 5 — habilita Supabase Realtime nas tabelas que o dashboard observa.
--
-- Sem isso a publicação supabase_realtime está vazia e nenhum postgres_changes
-- chega ao cliente, mesmo com um canal inscrito corretamente. RLS continua
-- valendo: cada role só recebe eventos das linhas que already enxergaria via
-- select (admin vê tudo; vendedor só o próprio recorte).
alter publication supabase_realtime add table public.vendas;
alter publication supabase_realtime add table public.caixas;
alter publication supabase_realtime add table public.movimentacoes_caixa;
alter publication supabase_realtime add table public.despesas;
