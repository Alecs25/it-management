# IT Credential Management App

Single-entry full-stack application based on Next.js (App Router), Prisma (MySQL), JWT + MFA, RBAC, and audit trail.

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- MySQL 8+

### Run

```bash
cd app
npm install
npm run dev
```

Application runs on http://localhost:3000.

## Architecture

```text
it-management/
├── app/                        # Full-stack Next.js project
│   ├── prisma/                 # Prisma schema + migrations
│   ├── src/app/                # Pages + API route handlers
│   ├── src/lib/                # Services, auth, config, db utils
│   └── src/components/         # Shared UI components
└── README.md
```

## Main Endpoints

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/mfa/enroll`
- POST `/api/auth/mfa/enroll-confirm`
- POST `/api/auth/mfa/verify`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`

### Business Modules
- GET/POST `/api/clients`
- GET/POST `/api/sites`
- GET/POST `/api/devices`
- GET/POST `/api/credentials`
- POST `/api/credentials/reveal`
- GET `/api/audit` (admin)

### Health
- GET `/api/health`

## Scripts

Run from `app/`:
- `npm run dev` — development server
- `npm run build` — Prisma generate + production build
- `npm run start` — run production build
- `npm run db:migrate` — Prisma migrations
- `npm run db:studio` — Prisma Studio

## Notes
- JWT is stored in httpOnly cookies.
- Middleware protects `/dashboard`, `/clients`, `/credentials`, `/devices`, `/audit`.
- Legacy `frontend/` and `backend/` folders have been removed.
