# AI-Powered Grievance Management System — Backend

Node.js + Express backend for the Grievance Management System. Handles user authentication, grievance submission/retrieval, and (optionally) proxies AI-based grievance classification to a separate Python service.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v24+) |
| Framework | Express.js |
| Database | PostgreSQL (via Prisma's local dev server) |
| ORM | Prisma (v7) |
| Auth | JWT (jsonwebtoken) + bcrypt password hashing |
| Dev tool | Nodemon (auto-restart on file changes) |

---

## 📁 Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database models (User, Grievance)
│   └── migrations/            # Auto-generated SQL migration history
├── prisma.config.ts           # Prisma v7 config (loads env, datasource)
├── src/
│   └── generated/
│       └── prisma/            # Auto-generated Prisma Client (DO NOT edit manually)
├── middleware/
│   └── auth.js                # JWT verification middleware for protected routes
├── routes/
│   ├── auth.js                # /auth/register, /auth/login
│   └── grievance.js           # /grievance/submit, /grievance/my-grievances
├── db.js                      # Shared Prisma Client instance (with driver adapter)
├── server.js                  # App entry point — wires routes, middleware, starts server
├── .env                       # Environment variables (NEVER commit this)
├── .gitignore
└── package.json
```

---

## ⚙️ Prerequisites

Before you start, make sure you have installed:

- **Node.js** (v18 or higher recommended) — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- **Git**

You do **not** need to install PostgreSQL separately — this project uses Prisma's built-in local Postgres dev server (`prisma dev`).

---

## 🚀 Setup Instructions (Cloning Fresh)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd backend
```

### 2. Install dependencies

```bash
npm install
```

This installs everything listed in `package.json`, including:
- `express` — web framework
- `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg` — database ORM + driver adapter
- `bcrypt` — password hashing
- `jsonwebtoken` — auth tokens
- `cors` — allows frontend (different port) to call this API
- `dotenv` — loads `.env` variables
- `nodemon` (dev dependency) — auto-restarts server on changes

### 3. Create your `.env` file

Create a `.env` file in the project root with the following variables:

```dotenv
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0"
JWT_SECRET="your_random_secret_string_here"
PORT=8000
```

- `DATABASE_URL` — you'll get the exact value from Step 4 below (it's printed to your terminal when you run `npx prisma dev`). Copy it exactly.
- `JWT_SECRET` — any long random string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `PORT` — the port this backend will run on (frontend expects `8000` by default).

> ⚠️ Never commit `.env` to git. Confirm `.env` is listed in `.gitignore`.

### 4. Start the local PostgreSQL server (Prisma dev)

In a **dedicated terminal window** (keep it running the whole time you develop):

```bash
npx prisma dev
```

This starts a local Postgres instance and prints a `DATABASE_URL` — copy that exact string into your `.env` file (see Step 3).

**Leave this terminal running** — if you close it, the database becomes unreachable and the backend will crash on any DB query.

### 5. Generate the Prisma Client

```bash
npx prisma generate
```

This reads `prisma/schema.prisma` and generates the database client code into `src/generated/prisma`. Re-run this any time you change `schema.prisma` without using `migrate dev` (which does it automatically).

### 6. Run database migrations (creates tables)

```bash
npx prisma migrate dev --name init
```

This creates the `User` and `Grievance` tables in your database based on `prisma/schema.prisma`.

### 7. Start the backend server

In a **separate terminal** (with `npx prisma dev` still running in the other one):

```bash
npm run dev
```

You should see:
```
Server running on http://127.0.0.1:8000
```

The backend is now live at `http://127.0.0.1:8000`.

---

## 🖥️ Running Everything Together (3 terminals)

| Terminal | Command | Purpose |
|---|---|---|
| 1 | `npx prisma dev` | Local Postgres database |
| 2 | `npm run dev` | Express backend (this repo) |
| 3 | `npm run dev` (in frontend repo) | Next.js frontend |

All three must be running simultaneously for the full app to work.

---

## 🗄️ Database Schema

**User**
| Field | Type | Notes |
|---|---|---|
| id | Int | Auto-increment primary key |
| name | String? | Optional |
| email | String | Unique |
| password | String | Bcrypt hash, never plain text |
| role | String | `"user"` or `"admin"`, defaults to `"user"` |
| createdAt | DateTime | Auto-set |

**Grievance**
| Field | Type | Notes |
|---|---|---|
| id | Int | Auto-increment primary key |
| description | String | The complaint text |
| status | String | Defaults to `"Pending"` |
| category | String? | Set by AI classification |
| priority | String? | Set by AI classification |
| region | String? | Set by AI classification |
| createdAt | DateTime | Auto-set |
| userId | Int | Foreign key → User.id |

To inspect your data visually at any time:
```bash
npx prisma studio
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create a new user account |
| POST | `/auth/login` | No | Log in, returns `{ access_token, role }` |
| GET | `/grievance/my-grievances` | Yes (Bearer token) | Get logged-in user's grievances |
| POST | `/grievance/submit` | Yes (Bearer token) | Submit a new grievance |
| GET | `/` | No | Health check |

**Auth header format for protected routes:**
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Flow

1. User registers/logs in → backend hashes/verifies password with bcrypt
2. On success, backend signs a JWT (`jsonwebtoken`) containing `{ userId, role }`, valid for 7 days
3. Frontend stores this token in `localStorage`
4. Every subsequent request attaches `Authorization: Bearer <token>`
5. `middleware/auth.js` verifies the token on protected routes and attaches `req.user`

---

## 🛠️ Common Issues & Fixes

| Problem | Cause | Fix |
|---|---|---|
| `Cannot find module '@prisma/client'` | Client not generated | Run `npx prisma generate` |
| `Cannot use import statement outside a module` | Prisma generated ESM/TS client | Ensure `db.js` imports from correct generated path; check `generator` block in `schema.prisma` |
| `PrismaClient was instantiated without any options. A driver adapter is required` | Prisma v7 requires explicit adapter | `db.js` must use `@prisma/adapter-pg` with `DATABASE_URL` (already configured in this repo) |
| CORS error in browser console | Backend allowing wildcard origin with credentials | `server.js` CORS config must specify exact frontend origin + `credentials: true` (already configured) |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` missing from `.env` | Add `JWT_SECRET` to `.env`, ensure `require('dotenv').config()` is the first line in `server.js` |
| `Schema metadata unavailable` in Prisma Studio | `prisma dev` terminal was closed | Restart `npx prisma dev` |

---

## 📝 Notes for Future Development

- `/ai/chat` endpoint (used by the chatbot on the frontend) is **not yet implemented** in this backend — it's meant to proxy to a separate Python microservice for NLP-based grievance classification.
- Admin-specific routes/dashboard are not yet built.
- Currently, `role` returned from `/auth/login` should be used by the frontend to determine dashboard redirect (rather than trusting a client-side role parameter) for proper access control.