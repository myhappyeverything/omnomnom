// Cloudflare Pages Function that proxies every /api/* request to the actual
// Worker (apps/api) at the edge, so the browser only ever talks to
// omnomnom.pages.dev. Cloudflare Pages' own _redirects proxying (200 status)
// can't do this — it only supports paths within the same Pages project, not
// an external domain like the Worker's *.workers.dev URL. A Pages Function
// doing the fetch itself has no such restriction.
//
// This matters beyond convenience: making the API same-origin makes the
// refresh-token cookie first-party, which Safari's Intelligent Tracking
// Prevention otherwise blocks outright (regardless of SameSite=None) — that
// was silently breaking persistent login on iOS.
//
// Lives at the repo root (not apps/web/functions) because the Pages
// project's "root directory" build setting is blank (repo root, needed for
// npm workspaces to resolve @omnomnom/shared) — Pages only looks for
// /functions at that configured root.
const API_ORIGIN = 'https://omnomnom-api.wasim-811.workers.dev'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const target = new URL(url.pathname + url.search, API_ORIGIN)
  return fetch(new Request(target, context.request))
}
