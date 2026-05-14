# AGENTS.md

Guidance for agentic coding assistants working in `math-games`.

## Project Scope

This repository root is the Math Games app. There is no nested app wrapper.

Portable game logic lives under `src/games/**/logic` and is imported through
the app-local `@/*` or `#/*` aliases.

## Stack

- TanStack Start + TanStack Router for routes and server functions.
- Cloudflare Workers runtime through `@cloudflare/vite-plugin`.
- Drizzle ORM with Cloudflare D1.
- Effect at server/runtime boundaries where workflows touch IO.
- Alchemy v2 for Cloudflare D1 and Worker infrastructure.
- pnpm only.

## Commands

```bash
pnpm check
pnpm infra:auth:check
pnpm infra:profile
pnpm infra:plan
pnpm deploy
pnpm smoke:remote
```

Focused local commands:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Route Policy

Canonical game routes are:

- `/games/magic-graph`
- `/games/sequence-race`
- `/games/shape-architect`

Old root game paths such as `/magic-graph`, `/sequence-race`, and
`/shape-architect` must stay rejected. Do not add redirects, aliases, or
fallback routes for them.

## Deployment

Deploy through Alchemy, not direct Wrangler deploys. Guarded deploy scripts
validate Cloudflare auth, run local checks, bootstrap/check the Alchemy
Cloudflare state store, and then run Alchemy plan/deploy.

Remote completion requires a deployed Worker smoke check. A passing remote
smoke must verify the `D1-backed profile state` marker, the `mg_player` cookie,
and the `D1-backed daily challenge row` marker on the deployed Worker.
