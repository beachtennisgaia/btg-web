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
- `SignUpButton` / `SignInButton` com `mode="modal"` **requerem `"use client"`** — nunca usar em Server Components, pois o click handler não é anexado
- Sempre envolver em `<Show when="signed-out">` para evitar no-op quando já autenticado
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
    icon.svg            ← favicon SVG (fundo #111, texto "BTG" em #F5C000)
    globals.css         ← inclui classes btg-* responsivas + @keyframes heroFadeIn
    layout.tsx          ← root layout com Google Analytics (G-TN8VZPFPNL, afterInteractive)
    page.tsx            ← homepage pública (ISR 60s)
    torneios/
      page.tsx          ← lista pública com duas queries (non-finished + finished com matches)
      tournaments-view.tsx ← client component com tabs + cards para cada estado
    ranking/            ← ranking público — stats (torneios/pontos/por realizar) são dinâmicos
    comunidade/         ← feed público (posts + sidebar com eventos reais da DB)
    dashboard/          ← área de sócio (protegida pelo Clerk)
    admin/              ← área de admin (role ADMIN obrigatório)
      layout.tsx        ← verifica role ADMIN, redireciona se não tiver
      socios/
        page.tsx        ← tabela inline (nível, quota, role, nº) + botão "✏️ Editar" por sócio
      hero/             ← galeria de imagens para o hero da homepage
        page.tsx        ← server component
        hero-gallery-manager.tsx ← client component (upload + gestão)
    api/
      webhooks/clerk/   ← webhook Clerk (svix)
      member/           ← criar/atualizar perfil
      admin/            ← endpoints protegidos para admin
        hero-images/    ← GET/POST/PATCH/DELETE imagens hero (Vercel Blob)
        members/[id]/   ← PATCH aceita: name, phone, gender, level, role, memberNumber, quotaYear
  components/
    nav.tsx             ← nav partilhada (client component, hamburger em mobile)
    admin-nav.tsx       ← nav do admin (hamburger mobile, sidebar slide-in, overlay)
    auth-buttons.tsx    ← HeroAuthButtons + CtaSignUpButton (client, com Show)
    hero-slideshow.tsx  ← slideshow cross-fade para o hero
    bracket-builder.tsx ← drag-and-drop para quadros de torneio
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

### Estilos e responsividade
- **Inline styles** (não Tailwind) para componentes complexos — padrão estabelecido no projeto
- Tailwind só para classes simples (`min-h-screen`, `flex`, `flex-col`) e classes responsivas
- Para responsividade: usar classes `btg-*` definidas em `globals.css` com `@media (max-width: 768px)`
  - `btg-grid-2` → grid 2 col no desktop, 1 col em mobile
  - `btg-section` → padding 64px 32px → 40px 16px
  - `btg-hero-title` → 58px → 36px
  - `btg-community-layout`, `btg-dash-layout` → flex row → column
  - `btg-sidebar`, `btg-member-card` → 280px → 100%
  - `btg-nav-links` / `btg-hamburger` → desktop/mobile nav toggle
- Cores BTG: amarelo `#F5C000`, amarelo escuro `#D4A800`, preto `#111111`
- Fontes: `var(--font-inter)` (corpo), `var(--font-oswald)` (títulos/números)
- Logo: usar sempre `btg-logo-white.png` (válido) em fundos escuros

---

## Modelos Prisma — resumo

| Modelo | Campos-chave |
|--------|-------------|
| `Member` | `clerkId`, `name`, `email`, `phone`, `gender`, `level`, `role`, `memberNumber`, `quotaYear` |
| `Tournament` | `name`, `date`, `location`, `format`, `category`, `maxPairs`, `status`, `finalsTemplate`, `isPaid`, `pricePerPlayer` |
| `Registration` | `tournamentId`, `player1Id`, `player2Id`, `status`, `seedNumber`, `paid` |
| `Match` | `tournamentId`, `round`, `position`, `groupNumber`, `pair1Id`, `pair2Id`, `score1`, `score2`, `winnerId`, `completedAt` |
| `RankingPoint` | `memberId`, `tournamentId`, `points`, `year` |
| `Post` | `authorId`, `type` (ANNOUNCEMENT\|COMMUNITY), `content` |
| `HeroImage` | `url`, `order`, `active` — imagens para o slideshow do hero |

`Tournament.status`: `DRAFT → OPEN → ONGOING → FINISHED`

`Tournament.format`: `ELIMINATION` | `NON_STOP`

### Armadilhas com Registration
- `registrationType = "INDIVIDUAL"` **não implica** que `player2` seja null — o admin pode emparelhar jogadores individualmente após inscrição
- Ao mostrar nomes de duplas, verificar sempre se `player2` existe: `reg.player2 ? "${p1} / ${p2}" : p1`
- `seedNumber` é usado em torneios eliminatórios para definir cabeças de chave (S1..Sn)

### Matches e resultados
- `groupNumber = null` → match de fase final (gerado por `generateFinals()`)
- `groupNumber >= 1` → match de pool/grupo Non-Stop
- `groupNumber = 0` pode existir como artefacto — tratar com cautela
- Para classificações de pool: calcular wins/losses e diferencial de games por `groupNumber`

---

## O que ainda falta implementar

- Fluxo de inscrição em torneio (`/torneios/:id/inscricao`) — página existe mas incompleta
- Formulário de criação de posts na página de comunidade (ComposeBox existe, verificar integração)
- Domínio custom `btgaia.pt` → Vercel
- Notificações por email com Resend
- Pagamento de quotas online
