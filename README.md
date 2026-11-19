# @fathym/sample-ui-workbench

Track 6 Phase 10 sample workbench demonstrating **WebMode** + the **workbench-consumes-workbench** primitive. Published to JSR as [`@fathym/sample-ui-workbench`](https://jsr.io/@fathym/sample-ui-workbench).

Sibling to [`sample-api-workbench`](https://github.com/fathym/sample-api-workbench) (the API-mode workbench this one consumes) and [`hello-workbench`](https://github.com/fathym-deno/hello-workbench) (the MCP-mode reference).

## What it demonstrates

Two Phase 10 primitives landing together in one sample:

1. **WebMode** (Phase 10 D.10.1) — the author writes a `serve(req)` fetch function and hands it to `WebMode({ handler: serve })`. OpenX runs it in a Container App at the Web mode's own Azure address, `https://{mode address}/` (the workbench's **Hosting** tab lists it) — browser reaches the routes below directly.

2. **Consumes primitive** (Phase 10 D.10.2–D.10.6) — the workbench declares a dependency on Phase 9's `api-workbench`, and OpenX injects that dependency's address inside your Azure (its in-environment address) as a `WB_CONSUMED_${alias}_URL` env var at deploy. The consumer reads it and calls the target directly; the call never passes through OpenX.

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
3. Deploy. Once `HostingStatus` is `Running`, the **Hosting** tab lists the Web mode's own address. Browse to:
   ```
   https://{mode address}/
   ```
   You should see the home page. Click `/products` to see the response from api-workbench.

## Outbound token

The `/products` route sends `Deno.env.get('FATHYM_OX_SERVICE_JWT')` as a bearer on its call to the consumed workbench, when that value is set. The call goes straight to the target's in-environment address, and the target checks its own callers, so set it (in the workbench's **Environment** tab) to a token the target's sign-in accepts. With it unset the request carries no `Authorization` header, which an open target (Auth **None**) takes as it is.

## Local run

Straight from JSR, no clone needed:

```
fai run jsr:@fathym/sample-ui-workbench --mode Web
```

Or from a clone:

```
deno task web
```

Either starts a local HTTP server on `http://localhost:4969`. The `/products` route won't reach a real api-workbench in local mode (no in-environment address) — it'll error on the fetch. Local run is mainly useful for hitting `/` to confirm HTML renders.

## Related

- **Track 6 v2 execution tracker**: [`o-industrial/oi-core-pack#61`](https://github.com/o-industrial/oi-core-pack/issues/61)
- **Phase 10 spec** (on `fathym-dev-space`): [`.workbench/.workstreams/2026-04-06-NewNodeCapabilities/track-6-workbench-node/phase-10-web-mode-composition.md`](https://github.com/fathym-deno/fathym-dev-space/blob/feature/track-6-phases-9-10-11/.workbench/.workstreams/2026-04-06-NewNodeCapabilities/track-6-workbench-node/phase-10-web-mode-composition.md)
- **The api-workbench this sample consumes**: [`fathym/sample-api-workbench`](https://github.com/fathym/sample-api-workbench)
- **The MCP-mode reference sample**: [`fathym-deno/hello-workbench`](https://github.com/fathym-deno/hello-workbench)

## License

MIT
