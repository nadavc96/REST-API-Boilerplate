# REST API Boilerplate

A production-ready Express + TypeScript starter with JWT authentication, refresh token rotation, input validation, rate limiting, and PostgreSQL. Built so any project can start right instead of refactoring later.

## Features

- **Authentication** — register, login, logout, and refresh token rotation using JWT
- **Validation** — request validation with Zod, fully typed end to end
- **Security** — Helmet, CORS, rate limiting, httpOnly cookies for refresh tokens
- **Database** — PostgreSQL with version-controlled SQL migrations
- **Type safety** — strict TypeScript, environment variables validated at startup
- **Docker** — full local development environment with Docker Compose

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Database | PostgreSQL (via `pg`) |
| Validation | Zod |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` |
| Migrations | `node-pg-migrate` |
| Containerization | Docker + Docker Compose |

## Project Structure

```
src/
├── index.ts                 # Entry point, starts the server
├── app.ts                   # Express app setup, middleware
│
├── config/
│   └── env.ts                # Environment variable validation
│
├── db/
│   ├── pool.ts                # Postgres connection pool
│   └── migrations/           # SQL migration files
│
├── modules/
│   └── auth/
│       ├── auth.routes.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.repository.ts
│       └── auth.schema.ts
│
├── middleware/
│   ├── authenticate.ts       # JWT verification middleware
│   └── validate.ts           # Request validation middleware
│
└── types/
    └── index.ts               # Shared TypeScript types
```

Each module follows a 4-layer pattern: **routes** define endpoints, **controllers** handle HTTP only, **services** hold business logic, **repositories** hold all database queries. This keeps business logic testable without a database, and the database layer swappable without touching business logic.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <your-repo-name>
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

### 3. Start the database

```bash
docker-compose up db
```

### 4. Run migrations

```bash
npm run migrate:up
```

### 5. Start the dev server

```bash
npm run dev
```

The API will be running at `http://localhost:3000` (or whatever `PORT` you set).

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the app runs on | `3000` |
| `DATABASE_URL` | Full Postgres connection string | — |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | — |
| `JWT_SECRET` | Secret used to sign JWTs | — |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime (JWT claim) | `7d` |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Refresh token lifetime in the database | `7` |
| `POSTGRES_USER` | Postgres username (Docker Compose) | — |
| `POSTGRES_PASSWORD` | Postgres password (Docker Compose) | — |
| `POSTGRES_DB` | Postgres database name (Docker Compose) | — |
| `POSTGRES_PORT` | Postgres port (Docker Compose) | `5432` |

All variables are validated at startup using Zod — the app refuses to start if anything required is missing, rather than failing unpredictably at runtime.

## API Endpoints

### `POST /auth/register`

Creates a new user account.

**Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response — `201`**
```json
{ "message": "Account created successfully" }
```

### `POST /auth/login`

Authenticates a user and returns an access token. Sets the refresh token as an httpOnly cookie.

**Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response — `200`**
```json
{ "accessToken": "eyJhbGciOi..." }
```

### `POST /auth/refresh`

Issues a new access token using the refresh token cookie. No body required.

**Response — `200`**
```json
{ "accessToken": "eyJhbGciOi..." }
```

### `POST /auth/logout`

Requires a valid access token (`Authorization: Bearer <token>`). Deletes the refresh token and clears the cookie.

**Response — `200`**
```json
{ "message": "Logged out successfully" }
```

## Authentication Flow

1. On register, the password is hashed with `bcrypt` before being stored — plaintext passwords are never saved.
2. On login, two tokens are issued: a short-lived **access token** (returned in the response body) and a long-lived **refresh token** (set as an httpOnly cookie, also stored in the database).
3. The client sends the access token in the `Authorization` header for protected routes.
4. When the access token expires, the client calls `/auth/refresh`. The server validates the refresh token against the database, deletes it, and issues a new pair — this is **refresh token rotation**, which limits the damage if a refresh token is ever stolen.
5. On logout, the refresh token is deleted from the database, invalidating that session.

A user can be logged in from multiple devices simultaneously — each login creates its own refresh token row, so logging in on a new device doesn't invalidate other sessions.

## Decisions

A few notes on the trade-offs made in this boilerplate, for context in interviews or for whoever extends it:

- **Zod over Joi/Yup** — Zod gives you the validation schema and the inferred TypeScript type from a single definition, so the validation logic and the types never drift apart.
- **Refresh token rotation** — storing refresh tokens in the database (rather than treating them as stateless JWTs) means they can be revoked on logout. Access tokens stay stateless and short-lived to limit exposure if one leaks.
- **Repository pattern** — all SQL lives in `*.repository.ts` files. Services never write queries directly, which keeps business logic testable without a real database and makes the database layer swappable.
- **Minimal `users` table** — only `email` and `password_hash` are included by default. This is a boilerplate, not a finished app — additional fields (name, username, avatar, etc.) are expected to be added per project.
- **UUID over auto-increment IDs** — prevents IDs from being guessable or leaking information about table size.

## Docker

`docker-compose.yml` is intended for **local development only** — it spins up Postgres (and optionally the app) so you don't need anything installed locally beyond Docker and Node.

```bash
# Start just the database
docker-compose up db

# Start everything (app + database)
docker-compose up
```

In production, this project is designed to pair a managed Postgres provider (e.g. Supabase, Railway, Neon) with a container host (e.g. Render, Railway, Fly.io). The `Dockerfile` builds the app image; `DATABASE_URL` and other secrets are set as environment variables on the hosting platform rather than committed anywhere.

## Roadmap

- [ ] Google OAuth (`passport.js`)
- [ ] Automated tests (Jest + Supertest)
- [ ] Role-based access control (RBAC) example
- [ ] OpenAPI/Swagger docs
