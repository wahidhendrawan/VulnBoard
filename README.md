# VulnBoard – Professional VAPT Report & Engagement Dashboard

[![CI](https://github.com/wahidhendrawan/VulnBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/wahidhendrawan/VulnBoard/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/wahidhendrawan/VulnBoard?sort=semver)](https://github.com/wahidhendrawan/VulnBoard/releases/latest)
[![License](https://img.shields.io/github/license/wahidhendrawan/VulnBoard)](LICENSE)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/wahidhendrawan/VulnBoard/badge)](https://scorecard.dev/viewer/?uri=github.com/wahidhendrawan/VulnBoard)
[![Pages](https://img.shields.io/badge/docs-🌐-orange.svg)](https://wahidhendrawan.github.io/VulnBoard/)

A self-hosted vulnerability management platform for VAPT consultants. Generate professional reports across multiple security frameworks, manage engagements, import scanner results, and export ready-to-deliver PDFs — all with authentication and persistent storage.

---

## Features

| Category | Features |
|---|---|
| **Frameworks** | OWASP Top 10 2021 (all 10), NIST CSF 2.0, ISO 27001:2022, PCI DSS 4.0, SANS/CWE Top 25 |
| **Templates** | Executive, Technical, Full Pentest — in English and Bahasa Indonesia |
| **Authentication** | JWT + bcrypt — per-consultant workspaces |
| **Persistence** | SQLite via Prisma — all engagements, findings, reports survive restarts |
| **PDF Export** | One-click PDF via Puppeteer (Chromium headless) |
| **Scanner Import** | Burp Suite XML, OWASP ZAP JSON, Nmap XML, Nessus (.nessus), Nuclei (JSON) |
| **Findings Library** | 40+ reusable finding templates (EN + ID), searchable by category |
| **White-label** | Per-engagement logo URL + brand color |
| **Multi-language** | Reports in English and Bahasa Indonesia |
| **Docker** | Fully containerized with persistent volumes |

---

## Quick Start (Docker Compose)

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET, e.g. `openssl rand -hex 32` (compose and the backend refuse to start without a 32+ char secret)

docker compose up -d
```

- Frontend: http://localhost:5173 (the browser reaches the API through nginx at `/api`)
- Backend API: http://localhost:4000 (bound to 127.0.0.1 only)

**Upgrading from an image that ran as root:** the backend now runs as the `node` user, so existing volumes need a one-time ownership fix:
```bash
docker compose run --rm --user root backend chown -R node:node /app/data
```

**Seed demo data (optional):**
```bash
docker compose exec backend npm run db:seed
# Demo login: demo@vulnboard.local / demo1234
```

---

## Development Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed   # optional: seed finding templates + demo user
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Architecture

```
VulnBoard/
├── docker-compose.yml       # Orchestration (backend + frontend + volumes)
├── .env.example             # Environment variables template
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma    # User, Engagement, Finding, Report, FindingTemplate
│   └── src/
│       ├── server.ts        # Express app entry
│       ├── db.ts            # Prisma singleton
│       ├── schemas.ts       # Zod validation schemas
│       ├── middleware/
│       │   └── auth.ts      # JWT middleware
│       ├── routes/
│       │   ├── auth.ts      # POST /register, /login
│       │   ├── engagements.ts
│       │   ├── reports.ts   # Generate + persist report
│       │   ├── pdf.ts       # GET /reports/:id/pdf
│       │   ├── scanner.ts   # POST /burp, /zap, /nmap
│       │   ├── findingTemplates.ts
│       │   ├── frameworks.ts
│       │   └── templates.ts
│       ├── services/
│       │   └── reportGenerator.ts  # Markdown generation engine
│       ├── data/
│       │   ├── frameworks.ts      # 5 frameworks, 67+ controls
│       │   ├── templates.ts       # 8 report templates (EN + ID)
│       │   └── findingTemplates.ts # 40 reusable finding templates
│       └── seed.ts          # DB seeder
└── frontend/
    ├── Dockerfile           # Multi-stage: Vite build → nginx
    ├── nginx.conf           # SPA routing + API proxy
    └── src/
        ├── api.ts           # Typed API client (axios + interceptors)
        ├── AuthContext.tsx  # Auth state management
        ├── ProtectedRoute.tsx
        ├── App.tsx          # Router + layout
        ├── pages/
        │   ├── Login.tsx
        │   └── Register.tsx
        └── components/
            └── SeverityBadge.tsx
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get JWT token |
| GET | `/api/frameworks` | No | List frameworks |
| GET | `/api/templates?frameworkId=` | No | List templates |
| GET | `/api/engagements` | Yes | List user engagements |
| POST | `/api/engagements` | Yes | Create engagement |
| GET | `/api/engagements/:id` | Yes | Get engagement + findings |
| DELETE | `/api/engagements/:id` | Yes | Delete engagement |
| POST | `/api/reports` | Yes | Generate + persist report |
| GET | `/api/reports/:id/pdf` | Yes | Download PDF |
| POST | `/api/scanner/burp` | Yes | Import Burp XML |
| POST | `/api/scanner/zap` | Yes | Import ZAP JSON |
| POST | `/api/scanner/nmap` | Yes | Import Nmap XML |
| POST | `/api/scanner/nessus` | Yes | Import Nessus (.nessus) |
| POST | `/api/scanner/nuclei` | Yes | Import Nuclei JSON |
| GET | `/api/finding-templates` | No | List finding templates |

---

## Persistent Volumes

| Volume | Path in container | Contents |
|---|---|---|
| `db_data` | `/app/data/vulnboard.db` | SQLite database |
| `reports_data` | `/app/data/reports/` | Generated PDF files |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — (required) | JWT signing key, 32+ random chars (`openssl rand -hex 32`); placeholders are refused |
| `DATABASE_URL` | `file:/app/data/vulnboard.db` | Prisma SQLite path |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `PORT` | `4000` | Backend port |
| `VITE_API_BASE` | `/api` | Frontend API base (build-time); `/api` goes through the nginx proxy |

---

## Tech Stack

- **Backend**: Node.js 24 · Express · TypeScript · Prisma ORM · SQLite
- **Auth**: JWT (`jsonwebtoken`) + bcryptjs
- **Validation**: Zod
- **PDF**: Puppeteer (Chromium headless, pre-installed in Docker)
- **Frontend**: React 18 · Vite · TypeScript · react-router-dom · axios
- **Containerization**: Docker Compose · nginx-unprivileged (frontend) · node:24-slim (backend), both non-root

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), not in a public issue.

## License

GPL-3.0. See [LICENSE](LICENSE).
