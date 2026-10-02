type LogFields = Record<string, string | number | boolean | null | undefined>

export function debugServerLogsEnabled() {
  return process.env.DEBUG_SERVER_LOGS === 'true'
}

export function getSafeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }

  return { name: 'UnknownError', message: 'Unknown error' }
}

export function createRequestLog(request: Request | undefined, path: string) {
  const requestId = request?.headers.get('x-request-id') ?? crypto.randomUUID()
  const startedAt = Date.now()

  function write(event: string, fields: LogFields = {}) {
    if (!debugServerLogsEnabled()) return

    console.log(JSON.stringify({
      scope: 'rebaflix-server',
      event,
      requestId,
      path,
      elapsedMs: Date.now() - startedAt,
      ...fields,
    }))
  }

  function error(event: string, err: unknown, fields: LogFields = {}) {
    const safeError = getSafeError(err)
    console.error(JSON.stringify({
      scope: 'rebaflix-server',
      event,
      requestId,
      path,
      elapsedMs: Date.now() - startedAt,
      errorName: safeError.name,
      errorMessage: safeError.message,
      ...fields,
    }))
  }

  return { requestId, write, error }
}

export function noStoreJsonHeaders(requestId?: string) {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    Vary: 'Cookie, Authorization',
    ...(requestId ? { 'X-Request-ID': requestId } : {}),
  }
}
