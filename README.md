# IT Credential Management App

ISO 27001 Compliant credential management system for IT companies.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- npm or pnpm
- MySQL 8.0+ (on Plesk or local)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run in development mode
npm run dev

# The server will start at http://localhost:3000
```

**Available Scripts:**
- `npm run dev` — Start development server with hot reload
- `npm run build` — Build for production
- `npm start` — Run production build
- `npm test` — Run unit tests
- `npm run migrate` — Run database migrations (Sprint 2+)

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run in development mode
npm start

# The frontend will start at http://localhost:4200
```

**Available Scripts:**
- `npm start` — Start development server with hot reload
- `npm run build` — Build for production
- `npm test` — Run unit tests
- `npm run lint` — Run linter

## 📁 Project Structure

```
it-management/
├── backend/                      # Express + TypeORM backend
│   ├── src/
│   │   ├── config/              # Configuration loader (Zod)
│   │   ├── services/            # Business logic
│   │   │   ├── auth-service.ts  # JWT + Argon2id
│   │   │   ├── mfa-service.ts   # TOTP 2FA
│   │   │   ├── crypto-service.ts # AES-256-GCM envelope encryption
│   │   │   ├── audit-service.ts  # Append-only audit log
│   │   │   └── rbac-service.ts   # Role-based access control
│   │   ├── database/            # TypeORM entities
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/          # Auth, rate limit, correlation ID
│   │   └── index.ts             # Entry point
│   ├── default.cfg              # Configuration file (INI-like)
│   ├── .env.example             # Environment variables template
│   ├── tsconfig.json            # TypeScript config
│   └── package.json
│
├── frontend/                     # Angular 17 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/            # Singleton services
│   │   │   │   └── auth/        # Auth service, guard, interceptor
│   │   │   ├── features/
│   │   │   │   ├── auth/        # Login, MFA enrollment
│   │   │   │   └── dashboard/   # Main dashboard
│   │   │   ├── app.component.ts
│   │   │   └── app.routes.ts
│   │   ├── styles.scss          # Global styles (Tailwind)
│   │   └── index.html
│   ├── tailwind.config.js
│   ├── angular.json
│   ├── tsconfig.json
│   └── package.json
│
└── docs/                        # Compliance documentation (Sprint 4+)
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    ├── ISO_27001.md
    └── API_SPEC.md
```

## 🔐 Security Features

### Sprint 1: Foundation ✅
- ✅ JWT-based authentication (Argon2id password hashing)
- ✅ TOTP 2-Factor Authentication (RFC 6238)
- ✅ Role-Based Access Control (RBAC)
- ✅ Append-only audit log with HMAC signatures
- ✅ Rate limiting on auth endpoints
- ✅ Correlation ID tracking for request tracing

### Sprint 2: Encryption (Coming Soon)
- 🔄 AES-256-GCM envelope encryption for credentials
- 🔄 PIN-protected credential reveal (30 sec TTL)
- 🔄 Complete change history (who/when/from where/old→new)
- 🔄 Secure export (CSV/JSON zipped with password)

### Sprint 3: Features (Coming Soon)
- 🔄 Client management (list + kanban views)
- 🔄 Site (location) hierarchy
- 🔄 Device inventory with floorplan positioning
- 🔄 Device credential linking

### Sprint 4: Compliance (Coming Soon)
- 🔄 TLS 1.2+ enforcement, HSTS, CSP headers
- 🔄 Key rotation strategy + versioning
- 🔄 Backup & disaster recovery automation
- 🔄 Incident response playbook
- 🔄 ISO 27001:2022 documentation pack

## 📝 API Endpoints

### Authentication

```bash
# Register user
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

# Login (step 1: password)
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
Response: { token, requiresMFA: true }

# Verify MFA (step 2: TOTP)
POST /api/auth/mfa/verify
{
  "token": "eyJhbG...",
  "code": "123456"
}
Response: { token (with mfa=true), userId, email, role }

# Get MFA QR code for enrollment
POST /api/auth/mfa/enroll
{ "email": "user@example.com" }
Response: { secret, qrCode }

# Confirm MFA enrollment
POST /api/auth/mfa/enroll-confirm
{
  "secret": "...",
  "code": "123456"
}
Response: { mfaEnabled: true, backupCodes: [...] }

# Refresh token
POST /api/auth/refresh
{ "refreshToken": "..." }

# Logout
POST /api/auth/logout
```

## 🧪 Testing

### Backend (Unit Tests)
```bash
cd backend
npm test
```

### Frontend (Unit Tests)
```bash
cd frontend
npm test
```

### Manual Testing (Sprint 1)
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Open http://localhost:4200
4. Try login with test user (username: admin, password: admin123456)
5. Verify MFA with 6-digit code simulator
6. Check audit logs in backend console

## 📊 Versioning & Changelog

- **Current Version:** 0.1.0 (Sprint 1 - Foundation)
- **See:** [VERSION_CONTROL.log](VERSION_CONTROL.log) for detailed versions
- **See:** [CHANGELOG.md](CHANGELOG.md) for release notes

## 🛠️ Development Guidelines

### Backend
- Use strict TypeScript (`tsconfig.json`)
- Follow service-oriented architecture
- All endpoints must:
  - Validate input (Zod schemas)
  - Check RBAC permissions
  - Log to audit service
  - Handle errors gracefully

### Frontend
- Use standalone components (Angular 15+)
- Use Angular signals for reactive state
- DaisyUI + Tailwind CSS for styling
- Components in `features/` folder (feature-based)
- Services in `core/` folder (singleton)

## 📚 Documentation

- [Architecture Design](./docs/ARCHITECTURE.md) (TODO: Sprint 2)
- [Security Guidelines](./docs/SECURITY.md) (TODO: Sprint 2)
- [ISO 27001 Compliance](./docs/ISO_27001.md) (TODO: Sprint 4)
- [API Specification](./docs/API_SPEC.md) (TODO: Sprint 2)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit with meaningful messages: `git commit -m "feat: add something"`
3. Push and create pull request
4. Ensure all tests pass before merging

## 📦 Deployment

### Plesk (Node.js + MySQL)
1. Upload `backend/` to Plesk
2. Configure Node.js application
3. Create database `it_management`
4. Set environment variables in `.env`
5. Run migrations: `npm run migrate`

### Frontend
1. Build: `npm run build`
2. Upload `dist/` to web root
3. Configure API endpoint in environment config

## 🔗 Related Files

- [Plan](./untitled:plan-itManagementCredentialsApp.prompt.md) — Sprint planning & roadmap
- [VERSION_CONTROL.log](./VERSION_CONTROL.log) — Detailed versioning (created at project init)
- [.env.example](./backend/.env.example) — Configuration template

## 📄 License

PROPRIETARY — All rights reserved. Internal use only.

---

**Last Updated:** 2026-03-10  
**Status:** Sprint 1 - Foundation Complete ✅
