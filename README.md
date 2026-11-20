# ASTRQ — Stock Tools Platform · Infrastructure

How the platform is deployed. No application code lives here: the runtime image
(backend + dashboard) is built by **astrq-platform-api** and pushed to GHCR; the
dashboard is released by **astrq-platform-ui**.

| Path | What it is |
|---|---|
| `render.yaml` | Render Blueprint: one image-backed web service on the free plan (Singapore), env vars and which secrets to enter in the dashboard |
| `docker-compose.yml` | Run the published image on a VPS or locally (`docker compose up -d`) |
| `deploy/keepalive-worker/` | Cloudflare Cron Worker that pings `/health` during trading hours so Render free does not sleep |
| `docs/deploy-render.md` | Full setup: GitHub org, GHCR, Render, Cloudflare R2/DNS/Access, keep-alive, migration from the single-repo service |

## Deploy flow

```
astrq-platform-ui  tag vX.Y.Z ─► GitHub Release ui-dist.tar.gz
astrq-platform-api ui.version ─┘   merge to main ─► Image workflow
                                    ─► ghcr.io/<org>/astrq-platform-api:sha-<commit>
                                    ─► Render Deploy Hook (?imgURL=that image)
```

Changing env vars or secrets: Render dashboard (secrets) or `render.yaml` here
(non-secret values, synced by the Blueprint). Rolling back: Render → Manual Deploy →
an older `sha-<commit>` tag.

Images come from the `caman23` organization (`ghcr.io/caman23/astrq-platform-api`).

## Checks

CI validates the YAML files, `docker compose config`, and runs the keep-alive Worker's
trading-window test (`node deploy/keepalive-worker/test.mjs`).
