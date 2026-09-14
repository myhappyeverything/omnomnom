/**
 * Fire a best-effort POST to an external webhook (e.g. a Make.com scenario that
 * sends an email). Never throws and never blocks the caller's success path — use
 * with `executionCtx.waitUntil` so it runs after the response is returned.
 */
export async function fireWebhook(url: string | undefined, payload: unknown): Promise<void> {
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Best-effort delivery; a down webhook must not affect the API request.
  }
}
