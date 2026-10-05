/**
 * UI Workbench — launcher / Entry point.
 *
 * fai's workbench runner picks up the `export default` and instantiates the
 * workbench. OpenX Deploy passes `--mode Web` (or another enabled mode).
 *
 * ## What this sample demonstrates
 *
 * Track 6 Phase 10 delivers two things together:
 *
 * 1. **WebMode** (D.10.1) — hosts an author-authored HTTP server. The
 *    `serve` function below is passed to `WebMode({ handler: serve })` and
 *    OpenX runs it in a Container App at
 *    `{workspace-origin}/oi-api/workbenches/{APISlug}/Web/`.
 *
 * 2. **Consumes primitive** (D.10.2–D.10.6) — a workbench declares
 *    dependencies on other workspace workbenches; the SOP injects each
 *    dependency's proxied URL as a `WB_CONSUMED_${alias}_URL` env var.
 *    This sample reads `WB_CONSUMED_products_URL` (populated when the
 *    workspace admin declares Consumes on Phase 9's `api-workbench` at
 *    mode `API`, alias `products`).
 *
 * The `/products` route below fetches from the injected URL and renders
 * the response as HTML — demonstrating one workbench consuming another.
 *
 * @module
 */
import { WebMode, Workbench, type WorkbenchBuilder } from '@fathym/fai/workbenches';

/**
 * Home route — links to /products.
 */
function renderHome(): Response {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>UI Workbench</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem; }
      h1 { color: #0f172a; }
      code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
      a { color: #0369a1; }
    </style>
  </head>
  <body>
    <h1>UI Workbench</h1>
    <p>Track 6 Phase 10 sample demonstrating <code>WebMode</code> + the
    workbench-consumes-workbench primitive.</p>
    <p>Try: <a href="./products">/products</a> — reads the injected
    <code>WB_CONSUMED_products_URL</code> env var, fetches from Phase 9's
    <code>api-workbench</code>, and renders the response.</p>
  </body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Products route — fetches from the consumed api-workbench and renders.
 *
 * Reads:
 * - `WB_CONSUMED_products_URL` — proxied URL for the API-mode container
 *   (populated by SOP D.10.4 when Consumes is declared)
 * - `FATHYM_OX_SERVICE_JWT` — service JWT for outbound proxy auth (see
 *   README caveat)
 */
async function renderProducts(): Promise<Response> {
  const productsUrl = Deno.env.get('WB_CONSUMED_products_URL');
  const jwt = Deno.env.get('FATHYM_OX_SERVICE_JWT');

  if (!productsUrl) {
    return htmlPage(
      'Missing WB_CONSUMED_products_URL',
      `<p>The Consumes-injection env var wasn't set. Configure the
      workspace admin to add a Consumes row on this workbench pointing at
      an API-mode workbench with alias <code>products</code>, then redeploy.</p>`,
      503,
    );
  }

  try {
    const upstream = await fetch(`${productsUrl}/hello/greet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      body: JSON.stringify({ arg0: 'UI workbench' }),
    });
    const text = await upstream.text();
    return htmlPage(
      'Products',
      `<p>Response from <code>${productsUrl}/hello/greet</code>:</p>
      <pre>${escapeHtml(text)}</pre>
      <p>Status: <code>${upstream.status}</code></p>`,
    );
  } catch (err) {
    return htmlPage(
      'Fetch failed',
      `<p>Could not reach <code>${productsUrl}/hello/greet</code>:</p>
      <pre>${escapeHtml(err instanceof Error ? err.message : String(err))}</pre>`,
      502,
    );
  }
}

function htmlPage(title: string, bodyHtml: string, status = 200): Response {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem; }
      h1 { color: #0f172a; }
      pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto; }
      code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
      a { color: #0369a1; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${bodyHtml}
    <p><a href="/">← back</a></p>
  </body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * The author-authored fetch handler. WebMode wraps this in a Deno.serve;
 * `/health` is reserved (SOP readiness) and never hits this function.
 */
function serve(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === '/' || url.pathname === '') {
    return renderHome();
  }
  if (url.pathname === '/products') {
    return renderProducts();
  }
  return new Response('Not Found', { status: 404 });
}

const workbench: WorkbenchBuilder = Workbench(
  'ui-sample',
  'Track 6 Phase 10 sample workbench demonstrating WebMode + Consumes.',
)
  .Modes({ Web: WebMode({ handler: serve }) });

export default workbench;
