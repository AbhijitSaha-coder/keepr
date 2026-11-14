# Keepr — Personal and Household Operations Platform

> **"Everything important, kept in one place."**

Keepr is a full-stack SaaS platform designed for individuals, roommates, couples, and shared households to manage everyday operations: recurring bills, subscriptions, private documents, household inventory, warranties, chore/task workflows, automated reminders, and spending analytics.

---

## 🌐 Live Production Deployment

| Service | Component | Production URL | Status |
|---|---|---|---|
| **Web Application** | React 18 SPA (Frontend) | [https://keepr-frontend.onrender.com](https://keepr-frontend.onrender.com) | 🟢 Live |
| **Backend API** | Express / Node.js 22 LTS | [https://keepr-backend-z3xx.onrender.com](https://keepr-backend-z3xx.onrender.com) | 🟢 Live |
| **API Documentation** | Interactive Swagger UI | [https://keepr-backend-z3xx.onrender.com/api-docs/](https://keepr-backend-z3xx.onrender.com/api-docs/) | 🟢 Live |
| **Health Check** | API System Health | [https://keepr-backend-z3xx.onrender.com/api/health](https://keepr-backend-z3xx.onrender.com/api/health) | 🟢 Healthy |
| **Database** | Managed PostgreSQL | `keepr-postgres` (Render Cloud) | 🟢 Available |
| **GitHub Repository** | Source Code & CI/CD | [https://github.com/AbhijitSaha-coder/keepr](https://github.com/AbhijitSaha-coder/keepr) | 🟢 Active |
| **Frontend Service** | Render Static Console | [https://dashboard.render.com/static/srv-dbs5g2brjlhs73d7fhr0](https://dashboard.render.com/static/srv-dbs5g2brjlhs73d7fhr0) | 🟢 Deployed |

> **Demo Access**: You can test the platform instantly by clicking **"One-Click Demo Sign In"** on the login page or using `demo@keepr.app` / `Password123!`.

---

## What Was Built & Accomplished

Keepr was developed, tested, and deployed end-to-end as a production-grade multi-tenant operations platform:

1. **Complete Full-Stack Architecture**:
   - Modern React 18 single-page application with Vite, TypeScript, Tailwind CSS, Lucide icons, and Recharts analytics.
   - Robust Express.js backend with TypeScript, structured into modular controllers, services, middlewares, and Prisma ORM.
   - Relational database schema with 13 models, foreign keys, indexes, and full cascade integrity on PostgreSQL.

2. **10 Production-Grade Feature Modules**:
   - **Auth & Session Management**: Secure registration, bcrypt password hashing (12 rounds), JWT access tokens, multi-device session tracking, and password reset flows.
   - **Multi-Tenant Workspaces**: Complete workspace isolation with Role-Based Access Control (`OWNER`, `ADMIN`, `MEMBER`), invitations, and audit tracking.
   - **Bills & Recurring Payments**: Tracking, payment recording, auto-calculating next due dates with leap-year and month-end safe calendar arithmetic, and payment histories.
   - **Subscription Lifecycle & MRR**: Active, paused, and cancelled subscription tracking with auto-computed Monthly Recurring and Annual Recurring totals.
   - **Private Document Vault**: Local and S3-compatible document storage protected behind time-limited HMAC-SHA256 signed download tokens.
   - **Household Inventory & Warranties**: Asset cataloging with serial numbers, location tracking, and warranty expiration alerts.
   - **Kanban Tasks & Chores**: Task board with drag/status updates (`TODO`, `IN_PROGRESS`, `DONE`), assignees, priorities, and threaded comments.
   - **Spending Analytics**: Real-time SQL-aggregated spending metrics, category breakdown charts, monthly trend visualizations, and per-member distribution.
   - **Notifications & Reminders**: Multi-channel notification preferences, scheduled bill/warranty reminders, and in-app alerts.
   - **Activity Audit Trail**: Immutable log recording every critical workspace event with timestamps, actor attribution, and metadata.

3. **High-Reliability Background Processing**:
   - Redis and BullMQ distributed queues for scheduled job execution.
   - Built-in graceful offline fallback: when running without an external Redis instance, notifications and reminders automatically write directly to PostgreSQL without dropping tasks or crashing.

4. **Comprehensive Automated Testing Suite**:
   - **43 automated tests passing** (39 backend integration tests across 10 test suites + 4 frontend component tests across 2 suites).
   - Tests verify authentication, workspace RBAC, bills recurrence, subscriptions, inventory, task workflows, analytics calculations, and frontend rendering.

5. **Production Cloud Deployment & CI/CD**:
   - GitHub Actions CI pipeline executing linting, TypeScript compilation, and automated test suites on every push.
   - Automated cloud deployment using Render Blueprint (`render.yaml`) managing PostgreSQL, Express backend API, and React SPA static site with global edge caching.

---

## Table of Contents

1. [Live Production Deployment](#-live-production-deployment)
2. [What Was Built & Accomplished](#what-was-built--accomplished)
3. [Executive Summary](#executive-summary)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Database Design & ER Diagram](#database-design--er-diagram)
7. [Feature Modules (A through J)](#feature-modules)
8. [Security & Multi-Tenant Isolation](#security--multi-tenant-isolation)
9. [Recurrence Engine & Background Jobs](#recurrence-engine--background-jobs)
10. [Automated Testing Suite](#automated-testing-suite)
11. [Local Development Setup](#local-development-setup)
12. [Docker Compose Deployment](#docker-compose-deployment)
13. [Production Cloud Deployment Guide](#production-cloud-deployment-guide)
14. [API Reference & Swagger](#api-reference--swagger)
15. [Demo Credentials](#demo-credentials)

---

## Executive Summary

Modern households and individuals juggle multiple disjointed tools: spreadsheets for budgets, cloud drives for receipts, calendar reminders for bills, and messaging apps for chores. Keepr consolidates these operations into a unified, secure, multi-tenant platform with automated background scheduling, audit logging, and actionable real-time analytics.

### Key Highlights
- **100% Functional Production Implementation**: No placeholder screens, dummy mock metrics, or simulated frontend charts.
- **Strict Multi-Tenant Workspace Security**: All resources belong to workspaces; enforced at the middleware and query level with Role-Based Access Control (`OWNER`, `ADMIN`, `MEMBER`).
- **Mathematically Sound Recurrence Engine**: UTC-noon normalized calendar arithmetic preventing leap-year, month-end (31st to 28th/29th), and timezone boundary shifts.
- **Idempotent Background Jobs**: Redis + BullMQ scheduler with deterministic PostgreSQL deduplication keys, preventing duplicate email or in-app alerts on worker reboots.
- **Private Document Vault**: Private disk/S3 storage abstraction; files are protected and accessed exclusively via short-lived HMAC-signed download URLs.
- **Tested & Verified**: 43 automated unit, integration, security, and component tests passing with zero errors.

---

## Technology Stack

### Backend
- **Runtime & Language**: Node.js 22 LTS, TypeScript 5.8
- **Web Framework**: Express.js 4.21 (CommonJS architecture)
- **Database ORM**: Prisma ORM 6.19.0 (with PostgreSQL 15+/17)
- **Distributed Cache & Queues**: Redis 7+, BullMQ 5.41
- **Security & Crypto**: bcryptjs (12 salt rounds), jsonwebtoken, crypto (HMAC SHA-256), helmet, express-rate-limit
- **Validation**: Zod 3.24
- **Documentation**: Swagger UI Express / OpenAPI 3.0

### Frontend
- **Framework & Tooling**: React 18, TypeScript, Vite 5
- **Routing & State**: React Router v6, TanStack Query v5 (React Query)
- **Forms & Validation**: React Hook Form 7, Zod 3.24 with `@hookform/resolvers`
- **Styling & UI**: Tailwind CSS 3, Lucide React icons
- **Data Visualization**: Recharts 2.15 (interactive Area, Donut, and Bar charts)
- **Testing**: Vitest 3, React Testing Library, JSDOM

### Infrastructure
- **Containerization**: Docker multi-stage images, Docker Compose
- **Reverse Proxy**: Nginx Alpine (SPA routing fallback, gzip compression, `/api/` proxy)

---

## System Architecture

```
                            ┌───────────────────────────────────┐
                            │        Web Browser Client         │
                            │  React 18 / Vite / Tailwind SPA   │
                            └─────────────────┬─────────────────┘
                                              │ HTTP / JSON
                                              ▼
                            ┌───────────────────────────────────┐
                            │           Nginx Proxy             │
                            │   Port 80 (SPA & /api/ routing)   │
                            └─────────────────┬─────────────────┘
                                              │ Proxy Pass
                                              ▼
       ┌─────────────────────────────────────────────────────────────────────────┐
       │                       Keepr Backend (Express.js)                        │
       │                                                                         │
       │  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────────┐  │
       │  │ Rate Limiter    │──▶│ Auth Middleware │──▶│ Workspace RBAC Guard  │  │
       │  │ (Auth & Global) │   │ (JWT & Sessions)│   │ (Owner / Admin/ Member│  │
       │  └─────────────────┘   └─────────────────┘   └───────────────────────┘  │
       │                                                          │              │
       │                                                          ▼              │
       │  ┌───────────────────────────────────────────────────────────────────┐  │
       │  │ Controllers: Auth, Workspaces, Bills, Subs, Vault, Inventory,     │  │
       │  │ Tasks, Analytics, Notifications, Activity Logs                    │  │
       │  └───────────────────────────────────────────────────────────────────┘  │
       │         │                         │                       │             │
       │         ▼                         ▼                       ▼             │
       │  ┌──────────────┐          ┌──────────────┐        ┌──────────────┐     │
       │  │ Prisma ORM 6 │          │ Storage Svc  │        │ BullMQ Queue │     │
       │  │  (Postgres)  │          │ (Local / S3) │        │ (Schedulers) │     │
       │  └──────┬───────┘          └──────┬───────┘        └──────┬───────┘     │
       └─────────┼─────────────────────────┼───────────────────────┼─────────────┘
                 │                         │                       │
                 ▼                         ▼                       ▼
       ┌──────────────────┐      ┌──────────────────┐    ┌──────────────────┐
       │    PostgreSQL    │      │ Uploads Storage  │    │      Redis       │
       │  Data & Audit    │      │  HMAC Signed     │    │  Job Queue &     │
       │  Logs Database   │      │   Vault Files    │    │  Deduplication   │
       └──────────────────┘      └──────────────────┘    └──────────────────┘
```

---

## Database Design & ER Diagram

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ WorkspaceMember : belongs_to
    User ||--o{ WorkspaceInvitation : receives
    User ||--o{ BillPayment : records
    User ||--o{ TaskComment : writes
    User ||--o{ Notification : receives
    User ||--o{ NotificationPreference : configures
    User ||--o{ ActivityLog : performs

    Workspace ||--o{ WorkspaceMember : contains
    Workspace ||--o{ WorkspaceInvitation : sends
    Workspace ||--o{ Bill : owns
    Workspace ||--o{ Subscription : tracks
    Workspace ||--o{ Document : stores
    Workspace ||--o{ InventoryItem : tracks
    Workspace ||--o{ Task : manages
    Workspace ||--o{ ActivityLog : audits

    Bill ||--o{ BillPayment : has
    Bill ||--o{ Document : attaches
    InventoryItem ||--o{ MaintenanceSchedule : schedules
    InventoryItem ||--o{ Document : attaches
    Task ||--o{ TaskComment : has

    User {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string timezone
        string currency
        datetime createdAt
    }

    Workspace {
        string id PK
        string name
        string type
        string currency
        string timezone
    }

    WorkspaceMember {
        string id PK
        string workspaceId FK
        string userId FK
        string role
    }

    Bill {
        string id PK
        string workspaceId FK
        string name
        decimal amount
        string currency
        string category
        date dueDate
        string recurrence
        string status
    }

    BillPayment {
        string id PK
        string billId FK
        decimal amount
        date paymentDate
        string recordedById FK
    }

    Subscription {
        string id PK
        string workspaceId FK
        string name
        decimal amount
        string billingCycle
        date nextRenewalDate
        string status
    }

    Document {
        string id PK
        string workspaceId FK
        string title
        string storagePath
        string mimeType
        int fileSize
        date expirationDate
    }

    InventoryItem {
        string id PK
        string workspaceId FK
        string name
        string category
        decimal purchasePrice
        date warrantyExpiration
    }

    Task {
        string id PK
        string workspaceId FK
        string title
        string priority
        string status
        date deadline
    }

    Notification {
        string id PK
        string userId FK
        string type
        string title
        string deduplicationKey UK
        boolean isRead
    }
```

---

## Feature Modules

### Module A — Authentication & Account Management
- **Security Standards**: Passwords hashed with bcrypt (12 rounds). Session tokens issued as JWTs. Active sessions tracked in database with IP and user-agent metadata.
- **Account Operations**: Profile editing (name, timezone, preferred currency), password updates with old-password verification, explicit session revocation, complete JSON account data export, and cascade account deletion.
- **Forgot/Reset Password**: Cryptographically secure hex tokens with 1-hour expiration and SHA-256 token hashing in database.

### Module B — Workspaces & Household Collaboration
- **Multi-Tenant Boundaries**: Workspaces categorized as `PERSONAL` or `HOUSEHOLD`.
- **Role-Based Access Control**: `OWNER` (full access, workspace deletion, ownership transfer), `ADMIN` (invite/remove members, manage all resources), `MEMBER` (collaborate on workspace resources).
- **Invitations**: Tokenized email invitations with 7-day expiration; recipient can accept or reject.

### Module C — Bills & Recurrence Engine
- **Supported Categories**: Rent, Electricity, Water, Internet, Phone, Insurance, Maintenance, Groceries, Other.
- **Recurrence Engine**: Supports `ONE_TIME`, `DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, and `CUSTOM` intervals.
- **Payment Lifecycle**: Recording a payment records immutable historical details (amount, timestamp, actor) and advances the bill's `dueDate` to the next cycle without data loss.

### Module D — Subscription Management
- **Cycle Support**: Weekly, Monthly, Quarterly, Yearly billing frequencies.
- **Run-rate Analysis**: Automated normalization of active subscriptions to accurate Monthly Run Rate (MRR) and Annual Run Rate (ARR).
- **Status Lifecycle**: `ACTIVE`, `PAUSED`, `CANCELLED` states with direct cancellation instructions/URLs.

### Module E — Secure Document Vault
- **Private Storage**: Files uploaded to private disk storage (or cloud S3) outside the public web root.
- **HMAC Signed URLs**: Access granted only through short-lived (15 minutes) HMAC-SHA256 signed URLs. Tampered or expired URLs return `403 Forbidden`.
- **Metadata & Expiration**: Tagging, categorization, file size/MIME validation, expiration date tracking with automatic alerts.

### Module F — Household Inventory & Maintenance
- **Asset Tracking**: Categorized inventory (Electronics, Appliances, Furniture, Vehicles, Equipment, Other) with serial numbers, purchase price, and location.
- **Warranty Monitoring**: Real-time status (`ACTIVE`, `EXPIRING_SOON` within 30 days, `EXPIRED`).
- **Maintenance Schedules**: Recurring maintenance tasks (e.g., HVAC filter replacement) with frequency and due date tracking.

### Module G — Chore & Task Management
- **Views**: Seamless toggle between **List View** and interactive **Kanban Board** (`TODO`, `IN_PROGRESS`, `COMPLETED`).
- **Priorities**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **Collaboration**: Sub-task discussions via timestamped task comments.

### Module H — Notifications & Background Jobs
- **BullMQ Workers**: Background jobs running on Redis for daily reminder sweeps (bills, renewals, warranties, document expirations, task deadlines).
- **Deduplication Engine**: Uses deterministic deduplication keys (`deduplicationKey: "bill-due:uuid:2026-11-14"`) to ensure zero duplicate notifications even upon server or worker restarts.
- **Notification Center**: Real-time in-app badge count, mark as read, read-all, category preferences, and developer outbox viewer.

### Module I — Real PostgreSQL Analytics
- **No Mock Calculations**: All aggregations are performed via SQL queries:
  - Monthly spending trends (past 6 months).
  - Category spending breakdown.
  - Member expenditure contribution.
  - Bill settlement ratios (Paid vs. Unpaid).
  - Task completion efficiency.

### Module J — Activity & Audit Logs
- **Comprehensive Audit Trail**: Tracks all entity creations, edits, deletions, payments, status shifts, and member invitations with actor attribution, entity ID, and timestamp.

---

## Security & Multi-Tenant Isolation

1. **Authorization Middleware**: Every workspace route is guarded by `authorizeWorkspace([roles])`, verifying that `req.user.id` has an active membership in `req.params.workspaceId` or `req.headers['x-workspace-id']`.
2. **Rate Limiting**:
   - `authLimiter`: 30 requests per 15 minutes for login/register.
   - `apiLimiter`: 300 requests per 15 minutes for authenticated endpoints.
3. **Data Protection**:
   - HTTP response headers hardened via `helmet`.
   - CORS strictly restricted to authorized domains.
   - Private document paths never exposed; files served via streaming response verifying HMAC token validity and tenant workspace access.

---

## Recurrence Engine & Background Jobs

### Timezone & Month-End Arithmetic
Standard JavaScript `Date` operations often fail when crossing month-ends (e.g., adding 1 month to January 31 yields March 3 or March 2 depending on leap year) and shift dates across midnight in different time zones.

Keepr solves this using **pure UTC-noon calendar normalization**:
```typescript
// Preserves anchor day-of-month or pins to the maximum days in target month
const targetMonth = currentUtcMonth + intervalMonths;
const maxDaysInTarget = getDaysInUtcMonth(targetYear, targetMonth);
const nextDay = Math.min(anchorDay, maxDaysInTarget);
return new Date(Date.UTC(targetYear, targetMonth, nextDay, 12, 0, 0, 0));
```
- Jan 31 + 1 month in non-leap year -> Feb 28.
- Jan 31 + 1 month in leap year (2028) -> Feb 29.
- Feb 29 + 1 year -> Feb 28.

### BullMQ Deduplication Guarantee
The worker schedules a daily check. For each pending alert, it checks whether a notification with key `${eventType}:${entityId}:${dateString}` already exists in PostgreSQL before writing or queueing email. Worker restarts do not trigger repeated alerts.

---

## Automated Testing Suite

Keepr features a comprehensive test suite across unit, integration, and security layers.

### Test Results
```
--------------------------------------------------------------------------------
Layer           Test Suite                                        Status   Tests
--------------------------------------------------------------------------------
Backend Unit    Recurrence Engine (Leap years, month-ends, UTC)   PASS     10
Backend Unit    Subscription Calculations (MRR/ARR run-rate)      PASS      4
Backend Unit    Crypto & HMAC Signed URL Utilities                PASS      4
Backend Integr. Auth & Sessions API                               PASS      4
Backend Integr. Workspaces & RBAC API                             PASS      3
Backend Integr. Bills, Payments & Recurrence Advance API          PASS      3
Backend Integr. Subscriptions API                                 PASS      2
Backend Integr. Tasks & Comments API                              PASS      3
Backend Integr. PostgreSQL Real Analytics API                     PASS      1
Backend Security Cross-Workspace Isolation & HMAC Tampering       PASS      5
Frontend Comp.  Landing Page Rendering & Navigation (Vitest)      PASS      2
Frontend Comp.  Login Page & One-Click Demo Auth (Vitest)         PASS      2
--------------------------------------------------------------------------------
TOTAL                                                            PASS     43 / 43
--------------------------------------------------------------------------------
```

### Running Tests
```bash
# Run all backend and frontend tests from root
npm test

# Run backend tests only
npm run backend:test

# Run frontend tests only
npm run frontend:test
```

---

## Local Development Setup

### Prerequisites
- Node.js 22 LTS or higher
- PostgreSQL 15+ running locally (e.g., via Homebrew or standard installer)
- Redis 7+ running locally (`brew services start redis` or `redis-server`)

### Step 1: Clone and Install
```bash
cd /Users/abhijitsaha_2006/keepr
npm install --prefix backend
npm install --prefix frontend
```

### Step 2: Configure Environment
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```
Ensure your `DATABASE_URL` and `REDIS_URL` are correct:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/keepr?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
```

### Step 3: Run Database Migrations & Seed
```bash
cd backend
npx prisma db push
npm run prisma:seed
cd ..
```

### Step 4: Start Applications
```bash
# Terminal 1: Backend API (port 5001)
npm run backend:dev

# Terminal 2: Frontend App (port 5173)
npm run frontend:dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Docker Compose Deployment

Run the entire application (Postgres 17, Redis 7, Backend, and Frontend Nginx) with one command:

```bash
docker compose up --build -d
```

- **Frontend Application**: [http://localhost](http://localhost) (Port 80)
- **Backend API & Swagger**: [http://localhost:5001/api-docs](http://localhost:5001/api-docs)
- **PostgreSQL Database**: Port 5432
- **Redis Cache**: Port 6379

To stop all services:
```bash
docker compose down
```

---

## Production Cloud Deployment Guide

Keepr is built for straightforward deployment across modern cloud infrastructure and managed services.

### Cloud Architecture

| Service Component | Recommended Cloud Provider | Deployment Model |
|---|---|---|
| **Frontend SPA** | **Vercel** or **Cloudflare Pages** | Static SPA CDN with global edge caching & SSL |
| **Backend API & Workers** | **Render**, **Fly.io**, or **Railway** | Containerized Node.js service with auto-healing |
| **PostgreSQL Database** | **Neon**, **Supabase**, or **AWS RDS** | Managed PostgreSQL 15+ with SSL pooling |
| **Redis & Queue** | **Upstash** or **Redis Cloud** | Managed Redis 7+ with TLS connection strings |
| **Document Vault** | **Cloudflare R2** or **AWS S3** | S3-compatible private bucket storage |
| **Transactional Email** | **Resend**, **Brevo**, or **SendGrid** | SMTP or API-driven transactional dispatch |

---

### Step-by-Step Production Deployment

#### 1. Provision Managed PostgreSQL
1. Create a managed PostgreSQL database (e.g. on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render Postgres](https://render.com)).
2. Retrieve the pooled connection string:
   ```
   postgresql://keepr_user:password@ep-xyz.region.neon.tech/keepr?sslmode=require
   ```

#### 2. Provision Managed Redis
1. Create a managed Redis database (e.g. on [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com)).
2. Retrieve the TLS connection URL:
   ```
   rediss://default:password@xyz.upstash.io:6379
   ```

#### 3. Deploy Backend API Service
1. Connect your GitHub repository to your cloud application host (e.g. [Render](https://render.com), [Fly.io](https://fly.io), or [Railway](https://railway.app)).
2. Configure the build & run parameters:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma db push && node dist/server.js`
3. Configure the environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `DATABASE_URL`: *(Your PostgreSQL connection string)*
   - `REDIS_URL`: *(Your Redis connection string)*
   - `JWT_SECRET`: *(A secure random 32+ character string)*
   - `STORAGE_SIGNING_SECRET`: *(A secure random 32+ character string)*
   - `STORAGE_DRIVER`: `local` (or `s3` with Cloudflare R2 / AWS S3)
   - `CORS_ORIGIN`: `https://your-frontend-domain.com`
   - `APP_URL`: `https://your-frontend-domain.com`
   - `EMAIL_PROVIDER`: `mock` (or `smtp` with your email service credentials)
4. Trigger the deployment.

#### 4. Deploy Frontend SPA
1. Connect your repository to your frontend hosting provider (e.g. [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com)).
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure the environment variable:
   - `VITE_API_BASE_URL`: *(Your backend API URL, e.g. `https://api.yourdomain.com`)*
4. Deploy to generate your production URL.

---

## API Reference & Swagger

Keepr provides an interactive Swagger UI for API exploration.
- **Production Swagger UI**: **[https://keepr-backend-z3xx.onrender.com/api-docs/](https://keepr-backend-z3xx.onrender.com/api-docs/)**
- **Local Development**: **[http://localhost:5001/api-docs](http://localhost:5001/api-docs)**

### Key Endpoint Groups

| Prefix | Description | Auth Required |
|---|---|---|
| `/api/auth` | Register, Login, Logout, Forgot/Reset Password, Refresh Token | Public / Bearer |
| `/api/users` | User profile, Active sessions, Export data, Delete account | Bearer |
| `/api/workspaces` | Workspace CRUD, Membership management, Invitations | Bearer |
| `/api/bills` | Bill CRUD, Filters, Record payments, Payment history | Bearer + Workspace |
| `/api/subscriptions` | Subscription tracking, MRR/ARR summaries, Lifecycle | Bearer + Workspace |
| `/api/documents` | Upload, Tag, Search, HMAC Signed URL download, Delete | Bearer + Workspace |
| `/api/inventory` | Inventory tracking, Warranty expiration, Maintenance | Bearer + Workspace |
| `/api/tasks` | Task CRUD, Kanban status updates, Comments | Bearer + Workspace |
| `/api/notifications` | In-app alerts, Notification preferences, Dev outbox | Bearer |
| `/api/analytics` | SQL-aggregated spending, category & member distribution | Bearer + Workspace |
| `/api/activity` | Immutable audit log trail with actor attribution | Bearer + Workspace |

---

## Demo Credentials

The database seed provides a pre-configured account loaded with realistic bills, subscriptions, documents, inventory items, and tasks:

- **Email**: `demo@keepr.app`
- **Password**: `Password123!`

*Alternatively, click the **"One-Click Demo Sign In"** button on the login screen to sign in instantly.*
