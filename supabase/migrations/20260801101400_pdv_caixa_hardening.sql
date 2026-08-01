-- Correção apontada pelo advisor de segurança após a Fase 4.
--
-- `revoke execute ... from public` não basta: o Supabase mantém um DEFAULT
-- PRIVILEGE que concede EXECUTE explicitamente a anon/authenticated/service_role
-- em toda função criada no schema public. Ou seja, as funções do PDV ficavam
-- chamáveis via /rest/v1/rpc/* sem sessão.
--
-- Na prática cada função já barra o anônimo (auth.uid() nulo → NAO_AUTENTICADO),
-- mas a política do projeto é a mesma das tabelas: nenhum acesso anônimo, e a
-- checagem dentro da função é a segunda camada, não a única.

revoke execute on function public.registrar_venda(jsonb, jsonb, numeric) from anon;
revoke execute on function public.resumo_caixa(uuid) from anon;
revoke execute on function public.fechar_caixa(uuid, numeric) from anon;
revoke execute on function public.cancelar_venda(uuid) from anon;
revoke execute on function public.registrar_despesa(categoria_despesa, numeric, text, date, uuid) from anon;

-- Impede que a próxima função criada no schema public volte a nascer aberta.
alter default privileges in schema public revoke execute on functions from anon;
