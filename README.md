# @fathym/sample-ui-workbench

Track 6 Phase 10 sample workbench demonstrating **WebMode** + the **workbench-consumes-workbench** primitive. Published to JSR as [`@fathym/sample-ui-workbench`](https://jsr.io/@fathym/sample-ui-workbench).

Sibling to [`sample-api-workbench`](https://github.com/fathym/sample-api-workbench) (the API-mode workbench this one consumes) and [`hello-workbench`](https://github.com/fathym-deno/hello-workbench) (the MCP-mode reference).

## What it demonstrates

Two Phase 10 primitives landing together in one sample:

1. **WebMode** (Phase 10 D.10.1) — the author writes a `serve(req)` fetch function and hands it to `WebMode({ handler: serve })`. OpenX runs it in a Container App at `{workspace-origin}/oi-api/workbenches/{APISlug}/Web/` — browser reaches the routes below directly.

2. **Consumes primitive** (Phase 10 D.10.2–D.10.6) — the workbench declares a dependency on Phase 9's `api-workbench`, and OpenX injects that dependency's proxied URL as a `WB_CONSUMED_${alias}_URL` env var at deploy. The consumer reads it and calls back through the workspace proxy.

## Routes

| URL             | Behavior                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /`         | HTML home page with a link to `/products`                                                                                                                                           |
| `GET /products` | Reads `Deno.env.get('WB_CONSUMED_products_URL')` (populated by the Consumes injection), POSTs to `${products}/hello/greet` on Phase 9's api-workbench, renders the response as HTML |
| `GET /health`   | Reserved by WebMode — SOP readiness probe (200 OK; handler is bypassed)                                                                                                             |

## Deploy via OpenX

1. Ensure Phase 9's [`sample-api-workbench`](https://github.com/fathym/sample-api-workbench) is deployed in the same workspace with APISlug `api-sample` and API mode enabled. That's the target this UI workbench consumes.
2. Drop a **SurfaceWorkbench** onto a surface. In the inspector:
   - **Source** tab: Repo `https://github.com/fathym/sample-ui-workbench`, Ref `main`, Entry `workbenches/ui/local.ts`
   - **Hosting** tab: APISlug `ui-sample`
   - **Consumes** tab (Phase 10 D.10.6): add row `Workbench: api-sample`, `Mode: API`, `As: products`
   - **Modes** tab (after first deploy): enable `Web`
3. Deploy. Once `HostingStatus` is `Running`, browse to:
   ```
   {workspace-origin}/oi-api/workbenches/ui-sample/Web/
   ```
   You should see the home page. Click `/products` to see the response from api-workbench.

## Service JWT caveat (post-D.10.8 follow-up)

The `/products` route reads `Deno.env.get('FATHYM_OX_SERVICE_JWT')` to authenticate its outbound call to the workspace proxy. This env var is **not yet injected by the SOP** — Phase 10 shipped the `WB_CONSUMED_*_URL` env vars but left service-JWT injection as a follow-up (workbench containers currently have no built-in identity for calling back into the workspace).

**Workarounds until service-JWT injection lands:**

- **Manual per-workbench JWT**: paste a short-lived JWT into the workbench's `Details.Env` in the inspector under key `FATHYM_OX_SERVICE_JWT`. Rotate manually.
- **Skip auth entirely**: this sample's `/products` route sends the request without an Authorization header if the env var isn't set. It'll get `401 Unauthorized` from the proxy — you'll see the error rendered in the response. That IS a successful demonstration of the plumbing; only the auth handshake is missing.

Full E2E (including auth) requires a follow-on ticket for service-JWT injection.

## Local run

Straight from JSR, no clone needed:

```
fai run jsr:@fathym/sample-ui-workbench --mode Web
```

Or from a clone:

```
deno task web
```

Either starts a local HTTP server on `http://localhost:4969`. The `/products` route won't reach a real api-workbench in local mode (no proxy) — it'll error on the fetch. Local run is mainly useful for hitting `/` to confirm HTML renders.

## Related

- **Track 6 v2 execution tracker**: [`o-industrial/oi-core-pack#61`](https://github.com/o-industrial/oi-core-pack/issues/61)
- **Phase 10 spec** (on `fathym-dev-space`): [`.workbench/.workstreams/2026-04-06-NewNodeCapabilities/track-6-workbench-node/phase-10-web-mode-composition.md`](https://github.com/fathym-deno/fathym-dev-space/blob/feature/track-6-phases-9-10-11/.workbench/.workstreams/2026-04-06-NewNodeCapabilities/track-6-workbench-node/phase-10-web-mode-composition.md)
- **The api-workbench this sample consumes**: [`fathym/sample-api-workbench`](https://github.com/fathym/sample-api-workbench)
- **The MCP-mode reference sample**: [`fathym-deno/hello-workbench`](https://github.com/fathym-deno/hello-workbench)

## License

MIT
