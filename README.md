# BTG — Beach Tennis Gaia

Plataforma web para a associação BTG (Beach Tennis Gaia), Vila Nova de Gaia, Portugal. Cobre gestão de sócios, torneios, ranking e comunidade.

**Produção:** [btg-web-rho.vercel.app](https://btg-web-rho.vercel.app)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2 (App Router, React 19) |
| Auth | Clerk v7 (`@clerk/nextjs`) |
| Base de dados | Neon Postgres (serverless) |
| ORM | Prisma 7 + `@prisma/adapter-neon` |
| Storage | Vercel Blob |
| Email | Resend |
| Webhooks | svix (verificação de assinaturas Clerk) |
| Deploy | Vercel (org `velo-build`) |
| Design | Tailwind CSS v4, fontes Inter + Oswald |

---

## Arranque local

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# Preencher DATABASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
# CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET

# 3. Gerar cliente Prisma
npx prisma generate

# 4. Aplicar schema à DB
npx prisma db push

# 5. Correr em desenvolvimento
npm run dev
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string Neon Postgres (com `?sslmode=require`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Chave pública Clerk (`pk_test_...`) |
| `CLERK_SECRET_KEY` | Chave secreta Clerk (`sk_test_...`) |
| `CLERK_WEBHOOK_SECRET` | Signing secret do webhook Clerk (`whsec_...`) |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob (opcional, para upload de fotos) |
| `RESEND_API_KEY` | API key Resend (opcional, para emails) |

---

## Estrutura de rotas

```
/                   → Homepage (ISR 60s) — stats, próximos torneios, ranking
/torneios           → Lista de torneios (ISR 60s), tabs por estado
/ranking            → Ranking BTG do ano corrente
/comunidade         → Feed de posts e anúncios
/dashboard          → Área de sócio (protegida) + onboarding
/admin              → Painel de admin (role ADMIN obrigatório)
  /admin/torneios   → Gerir torneios (criar, mudar estado, ver inscrições)
  /admin/socios     → Gerir sócios (nº sócio, quota, nível, role)
  /admin/ranking    → Lançar pontos por torneio concluído
  /admin/comunidade → Publicar anúncios, apagar posts
```

### API routes

```
POST /api/member                  → Criar/atualizar perfil de sócio
POST /api/webhooks/clerk          → Webhook Clerk (user.created / user.updated)
GET  /api/admin/members           → Listar sócios (ADMIN)
PATCH /api/admin/members/[id]     → Atualizar sócio (ADMIN)
POST /api/admin/tournament        → Criar torneio (ADMIN)
```

---

## Modelo de dados

```
Member          → sócio (ligado ao Clerk via clerkId)
Tournament      → torneio (DRAFT → OPEN → ONGOING → FINISHED)
Registration    → inscrição de dupla num torneio
Match           → jogo entre duas duplas
Post            → post de comunidade ou anúncio
Photo           → foto associada a um post
RankingPoint    → pontos atribuídos a um sócio por torneio
Event           → evento da associação
```

Ver schema completo em `prisma/schema.prisma`.

---

## Fluxo de autenticação

1. Utilizador regista-se via Clerk (modal)
2. Webhook `user.created` → cria `Member` na DB com `name` e `email`
3. No `/dashboard`, se não tiver perfil completo → formulário de onboarding (telefone, nível)
4. Admins são definidos via `member.role = "ADMIN"` (gerido em `/admin/socios`)

---

## Deploy

```bash
# Build local antes de qualquer push
npm run build

# Push para main → deploy automático na Vercel
git push
```

O build corre `prisma generate && next build`. Não há branches — commits vão direto para `main`.

---

## GitHub

Org: [beachtennisgaia](https://github.com/beachtennisgaia) · Repo: `btg-web`
