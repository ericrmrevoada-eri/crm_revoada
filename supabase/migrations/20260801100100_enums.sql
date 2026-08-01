create type papel_usuario as enum ('admin', 'vendedor');
create type forma_pagamento as enum ('pix', 'cartao_debito', 'cartao_credito', 'dinheiro', 'misto');
create type status_venda as enum ('concluida', 'cancelada');
create type status_caixa as enum ('aberto', 'fechado');
create type tipo_movimentacao_caixa as enum ('sangria', 'suprimento', 'venda', 'despesa');
create type categoria_despesa as enum ('aluguel', 'frete', 'luz', 'outros');
