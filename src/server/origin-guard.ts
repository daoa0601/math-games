import { getRequestHeader } from '@tanstack/react-start/server'

export class CrossOriginError extends Error {
  override readonly name = 'CrossOriginError'
}

// Guard for state-mutating POST handlers. Browsers send Sec-Fetch-Site on all
// fetch/form requests; the same-origin/same-site values are CSRF-safe. The
// Origin/Host fallback catches non-browser clients (curl, scripted attackers
// without proper headers) and is what blocks the cross-site form-POST vector
// that SameSite=Lax still permits at top-level navigation.
export function assertSameOriginPost(): void {
  const fetchSite = getRequestHeader('sec-fetch-site')

  if (fetchSite === 'same-origin' || fetchSite === 'same-site') {
    return
  }

  if (fetchSite === 'cross-site' || fetchSite === 'cross-origin') {
    throw new CrossOriginError(
      `Cross-origin request rejected (Sec-Fetch-Site: ${fetchSite})`,
    )
  }

  const origin = getRequestHeader('origin')
  const host = getRequestHeader('host')

  if (!origin || !host) {
    throw new CrossOriginError(
      'Cross-origin: missing Origin or Host header on state-mutating request',
    )
  }

  let parsedOrigin: URL

  try {
    parsedOrigin = new URL(origin)
  } catch {
    throw new CrossOriginError('Cross-origin: malformed Origin header')
  }

  if (parsedOrigin.host !== host) {
    throw new CrossOriginError(
      `Cross-origin: Origin ${parsedOrigin.host} does not match Host ${host}`,
    )
  }
}
