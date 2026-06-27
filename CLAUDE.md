@AGENTS.md

# BTG Web — Guia para Claude Code

## Contexto do projeto

Plataforma da associação BTG (Beach Tennis Gaia). Cobre sócios, torneios, ranking e comunidade. Produção em `btg-web-rho.vercel.app`. Deploy direto em `main` (sem branches/PRs) — pré-lançamento, sem utilizadores reais ainda.

## Regra crítica de workflow

**Sempre correr `npm run build` localmente antes de `git push`.** O build corre `prisma generate && next build`. Se o build falhar, não fazer push.

---

## Stack e versões — diferenças críticas

### Next.js 16 (App Router)
- Middleware chama-se `proxy.ts` (não `middleware.ts`) — já está criado, não tocar
- `params` em page/route handlers é uma `Promise` — sempre `await params`
- Server Actions inline precisam de `"use server"` no topo da função aninhada ou no ficheiro

### Clerk v7 (`@clerk/nextjs ^7.5.9`)
- `auth()` é **async** — sempre `const { userId } = await auth()`
- `SignedIn` / `SignedOut` **não existem** — usar `<Show when="signed-in">` / `<Show when="signed-out">`
- Imports: server → `@clerk/nextjs/server`, client → `@clerk/nextjs`

### Prisma 7 + Neon
- **Sem `url` no `datasource`** do schema — a URL fica só em `prisma.config.ts`
- Usar sempre `PrismaNeon({ connectionString: process.env.DATABASE_URL })` via `src/lib/db.ts`
- Singleton em `src/lib/db.ts` — nunca instanciar `PrismaClient` diretamente

---

## Estrutura de ficheiros importantes

```
src/
  proxy.ts              ← middleware Clerk (não renomear)
  lib/
    db.ts               ← singleton Prisma+Neon
    actions.ts          ← Server Actions (requer role ADMIN)
  app/
    page.tsx            ← homepage (ISR 60s, dados reais da DB)
    torneios/           ← lista pública (ISR 60s)
    ranking/            ← ranking público
    comunidade/         ← feed público
    dashboard/          ← área de sócio (protegida pelo Clerk)
    admin/              ← área de admin (role ADMIN obrigatório)
      layout.tsx        ← verifica role ADMIN, redireciona se não tiver
    api/
      webhooks/clerk/   ← webhook Clerk (svix)
      member/           ← criar/atualizar perfil
      admin/            ← endpoints protegidos para admin
  components/
    nav.tsx             ← nav partilhada (client component)
prisma/
  schema.prisma         ← sem `url` no datasource
prisma.config.ts        ← URL da DB aqui
```

---

## Padrões a seguir

### Proteção de rotas de admin
```ts
// Em qualquer page/action de admin:
const { userId } = await auth();
const member = await db.member.findUnique({ where: { clerkId: userId } });
if (!member || member.role !== "ADMIN") redirect("/dashboard");
```

### Server Actions
- Estão todas em `src/lib/actions.ts`
- Todas chamam `requireAdmin()` internamente
- Após mutação, chamar `revalidatePath()` nas rotas afetadas

### Fetch de dados
- Server components para dados iniciais (`async function Page()`)
- `revalidate = 60` em páginas públicas com dados que mudam com frequência
- Client components apenas para interatividade (formulários inline, tabs)

### Estilos
- **Inline styles** (não Tailwind) para componentes complexos — padrão estabelecido no projeto
- Tailwind só para classes simples (`min-h-screen`, `flex`, `flex-col`)
- Cores BTG: amarelo `#F5C000`, amarelo escuro `#D4A800`, preto `#111111`
- Fontes: `var(--font-inter)` (corpo), `var(--font-oswald)` (títulos/números)
- Logo: usar sempre `btg-logo-white.png` (válido) em fundos escuros

---

## Modelos Prisma — resumo

| Modelo | Campos-chave |
|--------|-------------|
| `Member` | `clerkId`, `name`, `email`, `level`, `role`, `memberNumber`, `quotaYear` |
| `Tournament` | `name`, `date`, `location`, `format`, `category`, `maxPairs`, `status` |
| `Registration` | `tournamentId`, `player1Id`, `player2Id`, `status` |
| `RankingPoint` | `memberId`, `tournamentId`, `points`, `year` |
| `Post` | `authorId`, `type` (ANNOUNCEMENT\|COMMUNITY), `content` |

`Tournament.status`: `DRAFT → OPEN → ONGOING → FINISHED`

---

## O que ainda falta implementar

- Fluxo de inscrição em torneio (`/torneios/:id/inscricao`)
- Formulário de criação de posts na página de comunidade
- Domínio custom `btgaia.pt` → Vercel
- Notificações por email com Resend
- Gestão de resultados de jogos (modelo `Match` já existe no schema)
