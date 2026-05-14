import { Config } from 'effect'

export const AppConfig = Config.all({
  rateLimitWindowMs: Config.int('RATE_LIMIT_WINDOW_MS').pipe(
    Config.withDefault(250),
  ),
  solverTimeoutMs: Config.int('SOLVER_TIMEOUT_MS').pipe(
    Config.withDefault(5000),
  ),
  cookieMaxAge: Config.int('COOKIE_MAX_AGE').pipe(
    Config.withDefault(60 * 60 * 24 * 365),
  ),
  displayNameMaxLength: Config.int('DISPLAY_NAME_MAX_LENGTH').pipe(
    Config.withDefault(40),
  ),
})

export type AppConfigShape = Config.Success<typeof AppConfig>
