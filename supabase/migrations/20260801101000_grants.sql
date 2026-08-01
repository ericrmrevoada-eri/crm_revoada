-- Tabelas criadas pelo role "postgres" só recebem DELETE/REFERENCES/TRIGGER/MAINTAIN
-- por padrão para anon/authenticated/service_role — SELECT/INSERT/UPDATE precisam ser
-- concedidos explicitamente. RLS continua sendo a camada que restringe as linhas.
grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

-- Sistema interno de gestão: sem acesso anônimo a nenhuma tabela.
revoke all on all tables in schema public from anon;

-- Garante que tabelas criadas em migrations futuras já saiam com os grants corretos.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
