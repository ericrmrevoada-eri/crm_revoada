# Loja Revoada — Sistema de Gestão e PDV

Sistema web (Next.js + Supabase) para a Loja Revoada (streetwear, Maceió-AL): PDV,
estoque por grade, financeiro/caixa e dashboard, com dois perfis de acesso
(**admin** e **vendedor**).

Este README cobre o que já existe (Fases 1 a 4). Cada fase nova do projeto atualiza
esta seção.

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`
- Zod + React Hook Form

## Rodando localmente

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Configurar `.env.local`**

   Copie `.env.example` para `.env.local` e preencha:

   ```
   NEXT_PUBLIC_SUPABASE_URL=          # Project Settings > API > Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Project Settings > API > anon/public key
   SUPABASE_SERVICE_ROLE_KEY=         # Project Settings > API > service_role key
   ```

   A `service_role` key **nunca** é usada no client — só em Server Actions
   (`lib/supabase/admin.ts`), para operações que exigem a Admin API (ex: criar
   login de vendedor). Nunca a exponha com o prefixo `NEXT_PUBLIC_`.

3. **Aplicar as migrations num projeto Supabase novo**

   Com o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e logado:

   ```bash
   supabase link --project-ref <seu-project-ref>
   supabase db push          # aplica supabase/migrations/*.sql
   ```

   Para desenvolvimento 100% local (Postgres em Docker, sem depender do projeto
   cloud), use `supabase start` — isso já aplica as migrations e o
   `supabase/seed.sql` automaticamente.

4. **Gerar os tipos TypeScript do schema** (opcional, já versionado em
   `types/supabase.ts`; regenere após alterar migrations)

   ```bash
   supabase gen types typescript --project-id <seu-project-ref> > types/supabase.ts
   ```

5. **Rodar o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

   Abra http://localhost:3000 — a raiz redireciona para `/login`.

## Criando o primeiro administrador

O cadastro de usuários não é público — só o admin cria vendedores, de dentro do
sistema (`/vendedores`). Como não existe autocadastro, o **primeiro** admin
precisa ser criado manualmente uma única vez:

1. No dashboard do Supabase: **Authentication > Users > Add user**, crie o
   usuário com e-mail e senha (marque "Auto Confirm User").
2. Copie o `UUID` gerado.
3. No **SQL Editor** do Supabase, rode:

   ```sql
   insert into public.profiles (id, nome_completo, papel)
   values ('<uuid-copiado>', 'Nome do Admin', 'admin');
   ```

4. Faça login em `/login` com esse e-mail/senha — você cai direto no dashboard
   admin.

A partir daí, todo vendedor novo é cadastrado pela própria UI em **Vendedores**
(o admin define nome, telefone, e-mail e senha temporária; o vendedor pode trocar
a senha depois pelo fluxo de "Esqueci minha senha").

## Estrutura de pastas

```
app/
  (admin)/        rotas restritas a admin: dashboard, vendedores, estoque, financeiro
  pdv/            rota do PDV (admin e vendedor)
  login, esqueci-senha, redefinir-senha, auth/confirm  — autenticação
lib/supabase/     clients Supabase (browser, server, middleware, admin/service_role)
lib/validations/  schemas Zod
lib/pdv/          store do carrinho (Zustand)
lib/auth/         guardas de servidor (assertIsAdmin, obterUsuarioAtual)
actions/          Server Actions por domínio (auth, vendedores, estoque, caixa, vendas, despesas)
components/       ui (shadcn), layout, auth, admin, pdv, financeiro
supabase/
  migrations/     schema + RLS + funções transacionais (fonte de verdade do banco)
  seed.sql        dados de exemplo para dev local
types/supabase.ts tipos gerados do schema
```

## Arquitetura e RBAC

- **RLS em todas as tabelas** — a UI nunca é a única camada de proteção; as
  policies (`supabase/migrations/..._rls_policies.sql` e
  `..._perf_hardening.sql`) fazem cumprir as regras de negócio direto no banco.
- **`proxy.ts`** (antigo `middleware.ts`, renomeado na v16 do Next) renova a
  sessão a cada request e redireciona por papel: sem sessão → `/login`; vendedor
  tentando acessar rota de admin → `/pdv`; conta desativada (`profiles.ativo =
  false`) é deslogada na hora, mesmo com sessão já aberta.
- **Mutações sensíveis rodam em funções do Postgres**, não em várias chamadas
  soltas da Server Action. `registrar_venda`, `fechar_caixa`, `cancelar_venda` e
  `registrar_despesa` são `SECURITY DEFINER` com `search_path` fixo, resolvem o
  operador por `auth.uid()` (nunca por id vindo do cliente) e fazem tudo numa
  transação só. `registrar_venda` trava as variações com `SELECT ... FOR UPDATE`
  em ordem determinística de id, então dois PDVs vendendo a mesma peça ao mesmo
  tempo entram em fila em vez de furar o estoque ou travar em deadlock.
  As funções sinalizam regra de negócio violada com códigos secos
  (`CAIXA_FECHADO`, `ESTOQUE_INSUFICIENTE:<peça>`), traduzidos para o usuário em
  `lib/supabase/erros.ts`.
- **`lib/supabase/admin.ts`** usa a `service_role` key para operações privilegiadas
  (criar `auth.users` via Admin API) e só pode ser importado no servidor —
  o pacote `server-only` quebra o build se alguém importar isso num Client
  Component.

## Status por fase

- ✅ Fase 1 — Modelo de dados, migrations e RLS.
- ✅ Fase 2 — Autenticação, RBAC, estrutura base e tema visual.
- ✅ Fase 3 — Gestão de estoque por grade (produtos, variações, entradas,
  alertas de mínimo, upload de foto, categorias/fornecedores).
- ✅ Fase 4 — PDV e financeiro/caixa.
- ⏳ Fase 5 — Dashboard e relatórios.
- ⏳ Fase 6 — Testes end-to-end e polimento de UI/UX.

## PDV e caixa (Fase 4)

### Regras de operação

- **Ninguém vende sem caixa aberto** — vale para vendedor e para admin. Sem caixa,
  `/pdv` mostra apenas a abertura (valor inicial da gaveta); a mesma regra é
  reforçada dentro de `registrar_venda`, então nem uma chamada direta à API passa.
- **Um caixa aberto por operador por vez**, garantido pelo índice único
  `uniq_caixa_aberto_por_vendedor`.
- **Preço praticado vem sempre do banco.** O cliente não define preço unitário —
  o único ajuste na mão do vendedor é o **desconto**, que é livre (para kits do
  tipo "4 camisas por R$100") e **sempre gravado em `log_auditoria`**.
- **Pagamento misto**: cada venda grava uma linha em `pagamentos_venda` por forma
  usada, e uma movimentação de caixa por forma. É isso que permite o fechamento
  saber quanto entrou em **dinheiro** na gaveta e ignorar Pix/cartão.
- **Fechamento** compara `valor_abertura + vendas em dinheiro + suprimentos −
  sangrias − despesas pagas do caixa` com o valor contado pelo operador, e mostra
  sobra/falta na hora. O fechamento também vai para o log de auditoria.
- **Cancelamento de venda é só do admin e só enquanto o caixa da venda estiver
  aberto**: o estoque volta, as movimentações da venda saem do caixa. Depois do
  fechamento a função recusa — um caixa já conferido não é reescrito; o ajuste
  nesse caso é entrada de estoque + despesa, que ficam rastreáveis.
- **Resumo de WhatsApp** é gerado como texto e abre o `wa.me` pré-preenchido. O
  envio é manual, sem API paga e sem integração automática.

### Despesas

Despesa lançada com "pago com dinheiro do caixa" gera também a movimentação de
saída no caixa aberto do admin, na mesma transação. Sem a marcação, entra apenas
no resumo financeiro (caso de pagamento por transferência/boleto).

## Recomendações pendentes (não bloqueiam o uso)

- **Proteção contra senha vazada desligada.** O advisor do Supabase aponta que a
  checagem via HaveIBeenPwned está desativada. É configuração de projeto, não de
  código — ative em **Authentication > Policies > Password Security**.
- **Aviso de `SECURITY DEFINER` chamável por usuário logado.** O advisor lista as
  cinco funções da Fase 4 nesse aviso, e isso é intencional: elas *precisam* ser
  chamáveis pelo app autenticado, e cada uma valida `auth.uid()` e papel por
  dentro. O acesso anônimo a elas foi revogado explicitamente em
  `..._pdv_caixa_hardening.sql`.
