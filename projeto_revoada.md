Você vai atuar como engenheiro de software full-stack sênior e construir, do zero, o sistema
de gestão e PDV da "Loja Revoada", uma loja física de vestuário streetwear (Nike, Adidas,
Lacoste, Jordan, EA7, bonés, chinelos) localizada em Maceió-AL, bairro Chã da Jaqueira.
É uma loja única (sem filiais), com 2 a 3 vendedores operando o sistema simultaneamente.
Vende presencialmente e também recebe pedidos via Instagram/WhatsApp. Trabalha com ticket
médio baixo e promoções em kit (ex: "4 camisas por R$100"). A identidade visual da marca é
escura/urbana, com logo em gradiente neon (magenta/roxo/laranja) sobre fundo preto.

Há imagens de referência visual da marca na pasta /design-reference deste repositório
(logo, fachada da loja, fotos de produto). Use-as como referência de paleta de cores,
tom visual e estilo, mas construa uma interface de sistema (não um site de vendas):
prioridade total em clareza, densidade de informação controlada e rapidez de uso no
balcão, mesmo mantendo a linguagem visual da marca.

=== OBJETIVO GERAL ===
Construir um sistema web responsivo (mobile-first, utilizável em celular, tablet e desktop,
instalável como PWA) que substitua o controle manual da loja, cobrindo autenticação com
dois perfis (Administrador e Vendedor), PDV (frente de caixa), gestão de estoque por grade
(tamanho x cor), controle financeiro básico de caixa, e um dashboard com relatórios.

=== STACK TÉCNICA (obrigatória) ===
- Frontend: Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui para componentes.
- Backend: Server Actions e Route Handlers do próprio Next.js (sem serviço separado).
- Banco de dados / Auth / Storage / Realtime: Supabase (PostgreSQL).
- Cliente Supabase: usar @supabase/ssr para autenticação segura em Server Components.
- Deploy alvo: Vercel (frontend+backend) e Supabase Cloud (banco). Projetar tudo para
  rodar dentro dos limites do plano gratuito/inicial dessas plataformas.
- Gerenciamento de estado no cliente: React Server Components sempre que possível;
  usar Zustand ou React Query apenas onde houver necessidade real de estado no cliente
  (ex: carrinho do PDV antes de finalizar a venda).
- Validação de formulários: Zod + React Hook Form.

=== IDENTIDADE VISUAL ===
- Tema escuro como padrão (fundo preto/grafite #0a0a0a a #1a1a1a).
- Cor de destaque (accent) em gradiente neon: magenta/roxo (#a21caf a #ec4899) ou
  laranja/vermelho neon, usada em botões primários, ícones ativos e indicadores,
  seguindo as imagens em /design-reference.
- Tipografia bold/condensada para títulos (estilo urbano), mantendo alta legibilidade e
  contraste AA em todos os textos, especialmente em números do caixa e estoque.
- Componentes de UI compactos e otimizados para uso rápido com o dedo (PDV operado em
  tablet/celular no balcão): botões grandes, poucas etapas por tela.

=== PERFIS E CONTROLE DE ACESSO (RBAC) ===
Dois papéis: "admin" e "vendedor", controlados via tabela de perfis vinculada a
auth.users do Supabase e reforçados por Row Level Security (RLS) — nunca confiar apenas
em checagem no frontend.

Admin: acesso total. Vê faturamento diário/mensal/margem bruta, cadastra e edita produtos,
categorias, fornecedores e preços, cadastra vendedores (2-3 no total) e define permissões,
acessa todos os relatórios e exportações, gerencia abertura/fechamento de caixa de
qualquer operador.

Vendedor: acesso restrito ao operacional. Usa o PDV para registrar vendas, consulta
estoque (somente leitura), visualiza e opera apenas o caixa/turno dele, vê seu próprio
histórico e desempenho de vendas, não vê custos, margem ou faturamento consolidado da loja.

=== MODELAGEM DE DADOS (Supabase/PostgreSQL) ===
Crie as migrations SQL (pasta supabase/migrations) para as tabelas abaixo, com chaves
estrangeiras, índices nos campos de busca/filtro mais usados, e RLS habilitada em todas
as tabelas com policies específicas por perfil. Use UUID como chave primária (default
gen_random_uuid()) e colunas created_at/updated_at (timestamptz, default now()) em todas
as tabelas.

1. profiles: id (referencia auth.users.id), nome_completo, telefone, papel
   ('admin' | 'vendedor'), ativo (bool), created_at.
2. categorias: id, nome, descricao.
3. fornecedores: id, nome, telefone, observacoes.
4. produtos: id, nome, descricao, categoria_id (fk), fornecedor_id (fk), marca
   (ex: Nike, Adidas, Lacoste), preco_custo, preco_venda, foto_url (Supabase Storage),
   ativo (bool).
5. variacoes_produto: id, produto_id (fk), tamanho (P/M/G/GG ou numérico), cor,
   quantidade_estoque (int), estoque_minimo (int, para disparar alerta de reposição).
6. vendas: id, vendedor_id (fk profiles), status ('concluida' | 'cancelada'), forma_pagamento
   ('pix' | 'cartao_debito' | 'cartao_credito' | 'dinheiro'), valor_total, desconto,
   criado_em.
7. itens_venda: id, venda_id (fk), variacao_produto_id (fk), quantidade,
   preco_unitario_praticado, subtotal.
8. caixas: id, vendedor_id (fk), data_abertura, valor_abertura, data_fechamento
   (nullable), valor_fechamento_informado, valor_fechamento_calculado, status
   ('aberto' | 'fechado').
9. movimentacoes_caixa: id, caixa_id (fk), tipo ('sangria' | 'suprimento' | 'venda'
   | 'despesa'), valor, descricao, criado_em.
10. despesas: id, categoria ('aluguel' | 'frete' | 'luz' | 'outros'), descricao, valor,
    data, criado_por (fk profiles).
11. log_auditoria: id, usuario_id (fk), acao, tabela_afetada, registro_id, criado_em
    (para rastrear alterações sensíveis, ex: edição de preço ou exclusão de produto).

Para cada tabela, escreva as RLS policies explicitamente: admin com acesso total
(select/insert/update/delete); vendedor com select amplo em produtos/variacoes/categorias
(somente leitura), insert em vendas/itens_venda/movimentacoes_caixa restritos ao próprio
vendedor_id, e select restrito às próprias vendas/caixas (usando auth.uid()).

=== MÓDULOS FUNCIONAIS ===

Módulo 1 — Autenticação & Segurança
- Login via Supabase Auth (e-mail/senha). Tela de login com a identidade visual da marca.
- Redirecionamento por papel após login (admin -> dashboard, vendedor -> PDV).
- Fluxo de recuperação de senha por e-mail.
- Middleware do Next.js protegendo rotas por papel.
- Como são poucos usuários (2-3 vendedores + admin), o cadastro de novos usuários é
  feito manualmente pelo admin dentro do próprio sistema (sem autocadastro público).

Módulo 2 — Frente de Caixa (PDV)
- Tela otimizada para toque: busca de produto por nome ou categoria (sem leitor de
  código de barras nesta versão), seleção de tamanho/cor disponível, carrinho lateral
  com itens, quantidade e subtotal.
- Suporte a três formas de pagamento: Pix, cartão (débito/crédito) e dinheiro,
  incluindo pagamento misto se fizer sentido para o fluxo.
- Ao finalizar a venda: baixa automática e transacional no estoque (usar transação
  no Postgres para evitar condição de corrida em quantidade_estoque), geração de
  registro em vendas/itens_venda, e botão para gerar um texto-resumo formatado
  (produto, valores, forma de pagamento) que abre o WhatsApp Web/App com o texto
  pré-preenchido para envio manual ao cliente — sem integração automática/API paga.
- Vendedor só pode operar o PDV se tiver um caixa aberto no dia; caso contrário,
  o sistema solicita abertura de caixa com valor inicial antes de liberar o PDV.

Módulo 3 — Gestão de Estoque por Grade
- CRUD de produtos com upload de foto (Supabase Storage), categoria, fornecedor,
  preço de custo e venda.
- Cadastro de variações (matriz tamanho x cor) com quantidade em estoque por variação.
- Alertas visuais (badge/lista) para itens abaixo do estoque mínimo.
- Histórico de entradas de mercadoria (lote/data) vinculado ao fornecedor.

Módulo 4 — Financeiro Básico & Caixa
- Abertura e fechamento de caixa por vendedor/dia, com sangria e suprimento.
- Lançamento de despesas operacionais (aluguel, frete, luz, outros).
- Fechamento de caixa mostra automaticamente o valor calculado (abertura + vendas em
  dinheiro + suprimentos - sangrias - despesas) versus o valor informado pelo vendedor,
  destacando divergências.
- Resumo diário/mensal de entradas x saídas, visível apenas para admin.

Módulo 5 — Dashboard Estratégico & Relatórios (somente admin)
- Métricas em tempo real (Supabase Realtime): faturamento do dia/mês, ticket médio,
  quantidade de peças vendidas.
- Ranking de produtos mais vendidos (Top 10) e desempenho comparativo entre os 2-3
  vendedores.
- Exportação de relatórios em PDF e Excel/CSV (período customizável).

=== REQUISITOS NÃO FUNCIONAIS ===
- Responsivo mobile-first; testar em viewport de celular antes de desktop.
- Todas as mutações sensíveis (venda, ajuste de estoque, fechamento de caixa) devem
  ocorrer em transações no banco para manter consistência.
- Nunca expor a service_role key do Supabase no client; operações privilegiadas devem
  rodar em Server Actions/Route Handlers no servidor.
- Tratar estados de carregamento, vazio e erro em todas as telas (sem "tela branca").
- Código em TypeScript com tipos gerados a partir do schema do Supabase
  (supabase gen types typescript).
- Estrutura de pastas organizada por domínio (ex: /app/(admin), /app/(pdv), /lib/supabase,
  /components/ui, /components/estoque, /components/pdv etc.).

=== ENTREGÁVEIS ESPERADOS ===
1. Migrations SQL completas (schema + RLS policies) na pasta supabase/migrations.
2. Seed de dados de exemplo (categorias, produtos e variações fictícias) para testes.
3. Projeto Next.js completo rodando localmente com `npm run dev`, incluindo README
   com passo a passo de configuração das variáveis de ambiente (.env.local) e de
   como aplicar as migrations em um projeto Supabase novo.
4. Telas funcionais dos 5 módulos descritos acima, com a identidade visual definida.
5. Documentação curta (README ou /docs) explicando a arquitetura e como o admin
   cadastra um novo vendedor pelo próprio sistema.

=== ORDEM DE EXECUÇÃO SUGERIDA (siga fase a fase, aguardando validação a cada etapa) ===
Fase 1: Alinhar modelo de dados definitivo e criar as migrations (schema + RLS).
Fase 2: Autenticação, RBAC e estrutura base do projeto Next.js (layout, tema, navegação).
Fase 3: Módulo de Estoque (CRUD produtos/variações) — pré-requisito do PDV.
Fase 4: Módulo PDV (frente de caixa) e Módulo Financeiro/Caixa.
Fase 5: Dashboard, relatórios e exportações.
Fase 6: Testes manuais ponta a ponta, ajustes finos de UI/UX e responsividade.

Antes de começar a codificar, resuma o plano de implementação da Fase 1 e aguarde
minha confirmação.