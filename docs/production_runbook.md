# MedConnect Production Runbook

## 1) Pre-deploy checklist
- `DJANGO_DEBUG=False`
- Real secret values set in server environment (never commit secrets)
- TLS/HTTPS enabled at your edge (Nginx/Caddy/Cloudflare)
- `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` set to your domain
- Database backup from the last 24h exists

## 2) Deploy steps
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend python manage.py migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

## 3) Smoke tests
- `GET /` returns 200
- `GET /api/profile/` returns 401 for unauthenticated users
- Login code request endpoint returns success

## 4) Backup
```bash
./scripts/backup_postgres.sh
```

## 5) Restore (disaster recovery drill)
```bash
# Example restore from a backup file
cat backups/medconnect_YYYYMMDD_HHMMSS.sql | docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

## 6) Rollback strategy
- If deploy causes errors:
  1. Re-deploy last known good image tags
  2. Run migrations only if backward compatible
  3. Restore DB only if migration introduced data-level corruption and rollback requires it
