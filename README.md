English | [Tieng Viet](README.vi.md)

# Math Games

Math Games is a TanStack Start app for educational math practice. The app runs
on Cloudflare Workers, stores player progress in Cloudflare D1 through Drizzle,
uses Effect at server workflow boundaries, and manages Cloudflare resources
with Alchemy v2.

## Commands

```bash
pnpm install
pnpm dev
pnpm check
pnpm deploy
```

Focused checks:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Database and infrastructure:

```bash
pnpm db:generate
pnpm wrangler d1 execute DB --local --file drizzle/migrations/20260513164755_gray_iron_patriot/migration.sql
pnpm infra:login
pnpm infra:plan
pnpm infra:deploy
pnpm smoke:remote
```

Canonical game routes are `/games/magic-graph`, `/games/sequence-race`, and
`/games/shape-architect`. Old root game paths such as `/magic-graph` are
rejected instead of redirected.
