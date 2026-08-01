-- Seed de dados de exemplo para desenvolvimento/teste local.
-- Não inclui usuários (auth.users/profiles): esses são criados via Supabase Auth
-- (ver README, seção "Criando o primeiro admin") pois exigem a Admin API / signup.

insert into public.categorias (nome, descricao) values
  ('Camisetas', 'Camisetas e regatas streetwear'),
  ('Bermudas', 'Bermudas e shorts'),
  ('Bonés', 'Bonés e acessórios de cabeça'),
  ('Chinelos', 'Chinelos e sandálias'),
  ('Calçados', 'Tênis e calçados esportivos'),
  ('Jaquetas', 'Jaquetas e moletons');

insert into public.fornecedores (nome, telefone, observacoes) values
  ('Distribuidora Nordeste Streetwear', '(82) 99999-1111', 'Principal fornecedor de camisetas e bonés'),
  ('Atacado SportLine', '(82) 99999-2222', 'Tênis e chinelos'),
  ('Import Fashion AL', '(82) 99999-3333', 'Jaquetas e peças importadas');

-- Produtos (marca conforme mix da loja: Nike, Adidas, Lacoste, Jordan, EA7)
insert into public.produtos (nome, descricao, categoria_id, fornecedor_id, marca, preco_custo, preco_venda, ativo)
select
  p.nome, p.descricao,
  (select id from public.categorias where nome = p.categoria),
  (select id from public.fornecedores where nome = p.fornecedor),
  p.marca, p.preco_custo, p.preco_venda, true
from (values
  ('Camiseta Nike Sportswear', 'Camiseta básica manga curta', 'Camisetas', 'Distribuidora Nordeste Streetwear', 'Nike', 25.00, 60.00),
  ('Camiseta Adidas Trefoil', 'Camiseta estampada logo clássico', 'Camisetas', 'Distribuidora Nordeste Streetwear', 'Adidas', 25.00, 60.00),
  ('Camiseta Lacoste Piquet', 'Camiseta polo piquet', 'Camisetas', 'Distribuidora Nordeste Streetwear', 'Lacoste', 40.00, 90.00),
  ('Bermuda Jordan Jumpman', 'Bermuda moletom com bolsos', 'Bermudas', 'Import Fashion AL', 'Jordan', 35.00, 85.00),
  ('Bermuda EA7 Core', 'Bermuda esportiva tactel', 'Bermudas', 'Import Fashion AL', 'EA7', 38.00, 89.00),
  ('Boné Nike Aba Reta', 'Boné snapback aba reta', 'Bonés', 'Distribuidora Nordeste Streetwear', 'Nike', 20.00, 50.00),
  ('Boné Adidas Aba Curva', 'Boné dad hat aba curva', 'Bonés', 'Distribuidora Nordeste Streetwear', 'Adidas', 20.00, 50.00),
  ('Chinelo Nike Slide', 'Chinelo slide emborrachado', 'Chinelos', 'Atacado SportLine', 'Nike', 22.00, 55.00),
  ('Tênis Adidas Runfalcon', 'Tênis esportivo running', 'Calçados', 'Atacado SportLine', 'Adidas', 90.00, 199.00),
  ('Jaqueta EA7 Corta-vento', 'Jaqueta corta-vento com capuz', 'Jaquetas', 'Import Fashion AL', 'EA7', 70.00, 160.00)
) as p(nome, descricao, categoria, fornecedor, marca, preco_custo, preco_venda);

-- Variações (tamanho x cor) com estoques variados, incluindo casos abaixo do mínimo
-- para validar o alerta de reposição.
insert into public.variacoes_produto (produto_id, tamanho, cor, quantidade_estoque, estoque_minimo)
select v.produto_id, v.tamanho, v.cor, v.quantidade_estoque, v.estoque_minimo
from (
  select
    (select id from public.produtos where nome = x.nome) as produto_id,
    x.tamanho, x.cor, x.quantidade_estoque, x.estoque_minimo
  from (values
    ('Camiseta Nike Sportswear', 'P', 'Preto', 12, 5),
    ('Camiseta Nike Sportswear', 'M', 'Preto', 3, 5),
    ('Camiseta Nike Sportswear', 'G', 'Branco', 8, 5),
    ('Camiseta Adidas Trefoil', 'M', 'Preto', 10, 5),
    ('Camiseta Adidas Trefoil', 'G', 'Cinza', 2, 5),
    ('Camiseta Lacoste Piquet', 'M', 'Branco', 6, 3),
    ('Camiseta Lacoste Piquet', 'G', 'Marinho', 4, 3),
    ('Bermuda Jordan Jumpman', 'M', 'Preto', 7, 4),
    ('Bermuda Jordan Jumpman', 'G', 'Preto', 1, 4),
    ('Bermuda EA7 Core', 'M', 'Cinza', 5, 3),
    ('Boné Nike Aba Reta', 'Único', 'Preto', 15, 6),
    ('Boné Adidas Aba Curva', 'Único', 'Branco', 9, 6),
    ('Chinelo Nike Slide', '40/41', 'Preto', 10, 5),
    ('Chinelo Nike Slide', '42/43', 'Preto', 2, 5),
    ('Tênis Adidas Runfalcon', '40', 'Preto/Branco', 4, 3),
    ('Tênis Adidas Runfalcon', '41', 'Preto/Branco', 3, 3),
    ('Jaqueta EA7 Corta-vento', 'M', 'Preto', 3, 2),
    ('Jaqueta EA7 Corta-vento', 'G', 'Marinho', 1, 2)
  ) as x(nome, tamanho, cor, quantidade_estoque, estoque_minimo)
) as v;
