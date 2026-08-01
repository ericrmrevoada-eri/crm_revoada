# Loja Revoada — Sistema de Gestão e PDV

Sistema web (Next.js + Supabase) para a Loja Revoada (streetwear, Maceió-AL): PDV,
estoque por grade, financeiro/caixa e dashboard, com dois perfis de acesso
(**admin** e **vendedor**).

Este README cobre o que já existe (Fases 1 e 2). Cada fase nova do projeto atualiza
esta seção. Veja também `/docs` (a criar nas próximas fases) para detalhes de cada
módulo.

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
actions/          Server Actions (auth, vendedores)
components/       ui (shadcn), layout (shells admin/pdv), auth, admin
supabase/
  migrations/     schema + RLS (fonte de verdade do banco)
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
- **`lib/supabase/admin.ts`** usa a `service_role` key para operações privilegiadas
  (criar `auth.users` via Admin API) e só pode ser importado no servidor —
  o pacote `server-only` quebra o build se alguém importar isso num Client
  Component.

## Status por fase

- ✅ Fase 1 — Modelo de dados, migrations e RLS.
- ✅ Fase 2 — Autenticação, RBAC, estrutura base e tema visual.
- ⏳ Fase 3 — Gestão de estoque por grade.
- ⏳ Fase 4 — PDV e financeiro/caixa.
- ⏳ Fase 5 — Dashboard e relatórios.
- ⏳ Fase 6 — Testes end-to-end e polimento de UI/UX.
