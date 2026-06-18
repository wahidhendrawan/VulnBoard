[![CI](https://github.com/wahidhendrawan/VulnBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/wahidhendrawan/VulnBoard/actions/workflows/ci.yml)

# VulnBoard – Professional VAPT Report & Engagement Dashboard

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL-3.0-blue.svg)](https://github.com/wahidhendrawan/VulnBoard/blob/main/LICENSE)
[![Release](https://img.shields.io/badge/release-v1.0.0-green.svg)](https://github.com/wahidhendrawan/VulnBoard/releases)
[![CI](https://github.com/wahidhendrawan/VulnBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/wahidhendrawan/VulnBoard/actions)
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
| **Scanner Import** | Burp Suite XML, OWASP ZAP JSON, Nmap XML |
| **Findings Library** | 40+ reusable finding templates (EN + ID), searchable by category |
| **White-label** | Per-engagement logo URL + brand color |
| **Multi-language** | Reports in English and Bahasa Indonesia |
| **Docker** | Fully containerized with persistent volumes |

---

## Quick Start (Docker Compose)

```bash
cp .env.example .env
# Edit .env — set a strong JWT_SECRET

docker compose up -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

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
│       ├── parsers/
│       │   ├── burp.ts      # Burp Suite XML parser
│       │   ├── zap.ts       # OWASP ZAP JSON parser
│       │   └── nmap.ts      # Nmap XML parser
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
| `JWT_SECRET` | `change-me` | **Change in production** — JWT signing key |
| `DATABASE_URL` | `file:/app/data/vulnboard.db` | Prisma SQLite path |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `PORT` | `4000` | Backend port |
| `VITE_API_BASE` | `http://localhost:4000/api` | Frontend API base (build-time) |

---

## Tech Stack

- **Backend**: Node.js 20 · Express · TypeScript · Prisma ORM · SQLite
- **Auth**: JWT (`jsonwebtoken`) + bcryptjs
- **Validation**: Zod
- **PDF**: Puppeteer (Chromium headless, pre-installed in Docker)
- **Frontend**: React 18 · Vite · TypeScript · react-router-dom · axios
- **Containerization**: Docker Compose · nginx (frontend) · node:20-slim (backend)
