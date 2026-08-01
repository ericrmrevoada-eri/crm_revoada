-- Foto por variação: uma camiseta em preto e em branco são a mesma "produtos"
-- row, mas o vendedor precisa ver a cor certa no PDV. `foto_url` aqui é
-- opcional — variação sem foto própria cai de volta na foto do produto (capa),
-- resolvido na camada de aplicação (actions/vendas.ts), não no banco.
alter table public.variacoes_produto
  add column foto_url text;
