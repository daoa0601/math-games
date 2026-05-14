import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Drizzle from 'alchemy/Drizzle'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export default Alchemy.Stack(
  'math-games',
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Drizzle.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const migrations = yield* Drizzle.Schema('math-games-schema', {
      schema: './src/db/schema.ts',
      out: './drizzle/migrations',
      dialect: 'sqlite',
    })

    const database = yield* Cloudflare.D1Database('DB', {
      name: 'math-games-db',
      migrationsDir: migrations.out,
      migrationsTable: 'drizzle_migrations',
      primaryLocationHint: 'wnam',
    })

    const worker = yield* Cloudflare.Vite('web', {
      name: 'math-games',
      compatibility: {
        date: '2026-05-13',
        flags: ['nodejs_compat'],
      },
      observability: {
        enabled: true,
        headSamplingRate: 1,
        logs: {
          enabled: true,
          invocationLogs: true,
          headSamplingRate: 1,
          persist: true,
        },
        traces: {
          enabled: true,
          headSamplingRate: 1,
          persist: true,
        },
      },
      assets: {
        directory: './dist/client',
        config: {
          runWorkerFirst: true,
        },
      },
      bindings: {
        DB: database,
      },
    })

    return {
      databaseId: database.databaseId,
      workerUrl: worker.url,
    }
  }),
)
