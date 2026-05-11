# MedConnect

MedConnect is a healthcare-focused platform that helps patients and researchers connect in one place.

It includes:
- patient/researcher profiles
- study discovery and participation
- EHR-style records (medical records, vitals, medications, etc.)
- appointments
- community features (posts, comments, likes)

This project is built as a full-stack app:
- **Backend:** Django
- **Frontend:** React + Vite + TypeScript
- **Database:** PostgreSQL (Docker)
- **Deployment style:** Docker Compose (single domain-ready architecture)

---

## Tech Stack

- **Backend:** Django, Gunicorn, django-cors-headers
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Database:** PostgreSQL 16
- **Web server / reverse proxy:** Nginx
- **Containerization:** Docker + Docker Compose

---

## Project Structure

```text
.
├── BACKEND/                  # Django app + API
│   ├── DockerFile
│   └── Requirement.txt
├── MedConnect-main/          # React frontend
│   ├── DockerFile
│   └── nginx/default.conf
├── docker-compose.prod.yml
└── .env.prod
```

---

## Quick Start (Docker)

### 1) Prerequisites
- Docker Desktop installed and running
- Port `80` available on your machine

### 2) Configure environment
Edit `.env.prod` and set your real secrets:

- `DJANGO_SECRET_KEY`
- `POSTGRES_PASSWORD`

For local testing (no domain yet), this repo is already set up for:
- `localhost`
- `127.0.0.1`
- non-HTTPS cookies (`SESSION_COOKIE_SECURE=false`, `CSRF_COOKIE_SECURE=false`)

### 3) Start services
From repo root:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### 4) Run migrations and collect static files

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend python manage.py migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend python manage.py collectstatic --noinput
```

### 5) Open the app

- Frontend: `http://localhost`
- API base (via nginx proxy): `http://localhost/api/...`

---

## Useful Commands

### Check container status
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### Check PostgreSQL readiness
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db sh -c "pg_isready -U $POSTGRES_USER -d $POSTGRES_DB"
```

### View logs
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f
```

### Stop stack
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

---

## Notes for Production

When you move from localhost to a real server/domain:

1. Update `.env.prod`:
   - `DJANGO_ALLOWED_HOSTS`
   - `CORS_ALLOWED_ORIGINS`
   - `CSRF_TRUSTED_ORIGINS`

2. Enable secure cookies (after HTTPS is active):
   - `SESSION_COOKIE_SECURE=true`
   - `CSRF_COOKIE_SECURE=true`

3. Use strong secrets and never commit real credentials.

---

## CI/CD (Planned / In Progress)

The intended CI/CD flow is:
- GitHub Actions builds Docker images
- images are pushed to GHCR
- deployment pulls latest images and runs `docker compose up -d`
- Django migrations run during deployment

---

## Repository

GitHub: [reacher-nomi/MedConnect](https://github.com/reacher-nomi/MedConnect)

---

## Disclaimer

This project is currently a development/student-style build and not a certified medical system.
If used with real patient data, proper compliance, security, and legal controls are required.
