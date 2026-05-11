# CI/CD Setup Guide

## Workflows added
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`

## Required GitHub Actions secrets
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`
- `SERVER_APP_PATH` (example: `/opt/medconnect`)
- `GHCR_USERNAME`
- `GHCR_TOKEN` (PAT with `read:packages`)

## Branch protection (manual in GitHub UI)
1. Go to **Settings -> Branches -> Add rule**.
2. Protect `main` (or `master`, whichever is your default).
3. Enable:
   - Require a pull request before merging
   - Require approvals (at least 1)
   - Require status checks to pass before merging
4. Select CI checks from `ci.yml` as required checks.

## Deployment flow
1. Push/merge to `main` or `master`.
2. `ci.yml` validates backend/frontend and image builds.
3. `cd.yml` builds and pushes latest images to GHCR.
4. CD SSHes to server and runs compose pull/up + migrate + collectstatic.

## Why `docker compose pull` can fail
- `denied` from GHCR usually means one of:
  - the package is private and the machine is not logged in to GHCR
  - token scope is missing `read:packages`
  - package name/tag is wrong
- `backend Skipped No image to be pulled` happens when service has no `image:` (only `build:`). This repo now defines images for both `backend` and `web` so pull-based deploy works.

## Required server-side GHCR login
Run once on server (or in deploy script):
```bash
docker login ghcr.io -u <github-username> -p <ghcr-token-with-read-packages>
```

Then:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
