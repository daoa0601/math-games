[English](README.md) | Tieng Viet

# Math Games

Math Games la ung dung TanStack Start cho luyen tap toan. Ung dung chay tren
Cloudflare Workers, luu tien trinh nguoi choi vao Cloudflare D1 qua Drizzle,
dung Effect o cac server workflow, va quan ly tai nguyen Cloudflare bang
Alchemy v2.

## Lenh

```bash
pnpm install
pnpm dev
pnpm check
pnpm deploy
```

Kiem tra rieng:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Co so du lieu va ha tang:

```bash
pnpm db:generate
pnpm wrangler d1 execute DB --local --file drizzle/migrations/20260513164755_gray_iron_patriot/migration.sql
pnpm infra:login
pnpm infra:plan
pnpm infra:deploy
pnpm smoke:remote
```

Route game chinh la `/games/magic-graph`, `/games/sequence-race`, va
`/games/shape-architect`. Cac root game path cu nhu `/magic-graph` bi tu choi,
khong redirect.
