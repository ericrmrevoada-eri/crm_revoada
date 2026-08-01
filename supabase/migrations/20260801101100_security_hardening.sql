-- Correções apontadas pelo advisor de segurança do Supabase logo após a Fase 1.

-- 1) search_path fixo também em set_updated_at (as demais funções já tinham).
alter function public.set_updated_at() set search_path = public;

-- 2) Extensões não devem morar no schema public.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- 3) is_admin()/aplicar_entrada_estoque() são helpers internos de RLS/trigger e não
-- deveriam ficar expostos via /rest/v1/rpc/*. Movidos para um schema que o PostgREST
-- não expõe. Policies e triggers referenciam a função pelo OID internamente, então
-- continuam funcionando sem precisar ser recriados.
create schema if not exists private;
alter function public.is_admin() set schema private;
alter function public.aplicar_entrada_estoque() set schema private;

grant usage on schema private to authenticated, service_role;

-- Funções ganham EXECUTE para PUBLIC por padrão ao serem criadas; revoga e concede
-- explicitamente só para quem precisa.
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

revoke execute on function private.aplicar_entrada_estoque() from public;
-- ninguém precisa chamar diretamente: só dispara via trigger em entradas_estoque.

-- 4) Bucket "produtos" é público (GET de URL direta não passa por RLS); a policy de
-- SELECT ampla também permitia LISTAR todos os arquivos via API. Restringe a listagem
-- ao admin.
drop policy if exists "produtos_public_read" on storage.objects;
create policy "produtos_admin_select" on storage.objects
  for select using (bucket_id = 'produtos' and private.is_admin());
