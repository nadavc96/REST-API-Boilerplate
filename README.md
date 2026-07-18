# REST API Boilerplate

A production-ready Express + TypeScript starter with JWT authentication, refresh token rotation, Google OAuth, Redis-backed rate limiting, input validation, and PostgreSQL. Built so any project can start right instead of refactoring later.

## Live Demo

Base URL: `https://rest-api-boilerplate-production.up.railway.app`

> Note: The free tier may have a cold start — the first request might take a few seconds.

Test it using the included [Postman collection](#postman-collection).

## Features

- **Authentication** — register, login, logout, and refresh token rotation using JWT
- **Google OAuth** — sign in with Google using Passport.js
- **Redis** — refresh tokens stored in Redis with automatic expiry; distributed rate limiting
- **Validation** — request validation with Zod, fully typed end to end
- **Security** — Helmet, CORS, rate limiting per route, httpOnly cookies for refresh tokens
- **Database** — PostgreSQL with version-controlled SQL migrations
- **Type safety** — strict TypeScript, environment variables validated at startup
- **Logging** — HTTP request logging with Morgan, application logging with Winston
- **Testing** — integration tests with Jest and Supertest
- **CI** — GitHub Actions runs tests on every push
- **Docker** — full local development environment with Docker Compose

## Tech Stack

| Layer            | Choice                                  |
| ---------------- | --------------------------------------- |
| Runtime          | Node.js + TypeScript                    |
| Framework        | Express                                 |
| Database         | PostgreSQL (via `pg`)                   |
| Cache            | Redis (via `node-redis`)                |
| Validation       | Zod                                     |
| Auth             | JWT (`jsonwebtoken`) + `bcrypt`         |
| OAuth            | Passport.js + `passport-google-oauth20` |
| Migrations       | `node-pg-migrate`                       |
| Logging          | Morgan + Winston                        |
| Testing          | Jest + Supertest                        |
| Containerization | Docker + Docker Compose                 |

## Project Structure

```
src/
├── index.ts                 # Entry point, starts the server
├── app.ts                   # Express app setup, middleware
│
├── config/
│   ├── env.ts               # Environment variable validation
│   ├── logger.ts            # Winston logger setup
│   ├── passport.ts          # Google OAuth strategy
│   └── redis.ts             # Redis client setup
│
├── db/
│   ├── pool.ts              # Postgres connection pool
│   └── migrations/          # SQL migration files
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
│   ├── authenticate.ts      # JWT verification middleware
│   ├── validate.ts          # Request validation middleware
│   ├── rateLimiter.ts       # Redis-backed rate limiting middleware
│   └── AppError.ts          # Custom error class
│
├── utils/
│   └── jwt.ts               # Token generation helpers
│
├── types/
│   └── index.ts             # Shared TypeScript types
│
└── tests/
    ├── setup.ts             # Jest setup, database and Redis cleanup
    └── auth.test.ts         # Auth endpoint integration tests
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

```bash
cp .env.example .env
```

Fill in your own values — see [Environment Variables](#environment-variables) below.

### 3. Start the database and Redis

```bash
docker-compose up db redis
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

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Go to **APIs & Services** → **OAuth consent screen** → set up as External
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:<PORT>/auth/google/callback` (development)
   - `https://your-production-url.com/auth/google/callback` (production)
7. Copy the **Client ID** and **Client Secret** to your `.env`

## Environment Variables

| Variable                    | Description                                  | Default                  |
| --------------------------- | -------------------------------------------- | ------------------------ |
| `PORT`                      | Port the app runs on                         | `3000`                   |
| `DATABASE_URL`              | Full Postgres connection string              | —                        |
| `REDIS_URL`                 | Redis connection string                      | `redis://localhost:6379` |
| `REDIS_PORT`                | Redis port (Docker Compose)                  | `6379`                   |
| `ALLOWED_ORIGINS`           | Comma-separated list of allowed CORS origins | —                        |
| `JWT_SECRET`                | Secret used to sign JWTs                     | —                        |
| `JWT_ACCESS_EXPIRY`         | Access token lifetime                        | `15m`                    |
| `JWT_REFRESH_EXPIRY`        | Refresh token lifetime (JWT claim)           | `7d`                     |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Refresh token lifetime in Redis              | `7`                      |
| `GOOGLE_CLIENT_ID`          | Google OAuth client ID                       | —                        |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth client secret                   | —                        |
| `GOOGLE_CALLBACK_URL`       | Google OAuth redirect URI                    | —                        |
| `FRONTEND_URL`              | Frontend URL for OAuth redirect              | —                        |
| `POSTGRES_USER`             | Postgres username (Docker Compose)           | —                        |
| `POSTGRES_PASSWORD`         | Postgres password (Docker Compose)           | —                        |
| `POSTGRES_DB`               | Postgres database name (Docker Compose)      | —                        |
| `POSTGRES_PORT`             | Postgres port (Docker Compose)               | `5432`                   |

All variables are validated at startup using Zod — the app refuses to start if anything required is missing, rather than failing unpredictably at runtime.

## API Endpoints

### `POST /auth/register`

Creates a new user account. Rate limited to 5 requests per 15 minutes per IP.

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

Authenticates a user and returns an access token. Sets the refresh token as an httpOnly cookie. Rate limited to 5 requests per 15 minutes per IP.

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

Requires a valid access token (`Authorization: Bearer <token>`). Deletes the refresh token from Redis and clears the cookie.

**Response — `200`**

```json
{ "message": "Logged out successfully" }
```

### `GET /auth/google`

Redirects to Google login page. Open in a browser — does not work in Postman.

### `GET /auth/google/callback`

Google redirects here after login. Returns an access token and sets the refresh token cookie.

**Response — `200`**

```json
{ "accessToken": "eyJhbGciOi..." }
```

> To redirect to a frontend instead, update `googleCallBack` in `auth.controller.ts` to use `res.redirect(\`${env.FRONTEND_URL}?accessToken=${accessToken}\`)`and add`FRONTEND_URL`to your`.env`.

## Postman Collection

A Postman collection is included at `postman_collection.json`. Import it into Postman to test all endpoints.

The collection includes:

- Pre-configured request bodies
- Automatic access token saving after login/refresh
- Authorization header pre-filled for logout

## Authentication Flow

1. On register, the password is hashed with `bcrypt` before being stored — plaintext passwords are never saved.
2. On login, two tokens are issued: a short-lived **access token** (returned in the response body) and a long-lived **refresh token** (set as an httpOnly cookie and stored in Redis with automatic expiry).
3. The client sends the access token in the `Authorization` header for protected routes.
4. When the access token expires, the client calls `/auth/refresh`. The server validates the refresh token in Redis, deletes it, and issues a new pair — this is **refresh token rotation**, which limits the damage if a refresh token is ever stolen.
5. On logout, the refresh token is deleted from Redis, invalidating that session immediately.

A user can be logged in from multiple devices simultaneously — each login creates its own Redis key, so logging in on a new device doesn't invalidate other sessions.

### Frontend Integration

When the access token expires (401 response), the frontend should automatically call `/auth/refresh` and retry the original request. The refresh token is sent automatically via the httpOnly cookie. Example with Axios:

```typescript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      await axios.post("/auth/refresh");
      return axios(error.config);
    }
    return Promise.reject(error);
  },
);
```

## Running Tests

Start the test containers first:

```bash
docker-compose up db-test redis-test
```

Then run migrations against the test database:

```bash
# PowerShell
$env:DATABASE_URL="postgres://user:password@localhost:5433/mydb_test"
npm run migrate:up

# Mac/Linux
DATABASE_URL=postgres://user:password@localhost:5433/mydb_test npm run migrate:up
```

Then run tests:

```bash
npm test
```

## Decisions

- **Zod over Joi/Yup** — Zod gives you the validation schema and the inferred TypeScript type from a single definition, so the validation logic and the types never drift apart.
- **Refresh tokens in Redis over Postgres** — Redis handles token expiry automatically (no manual cleanup needed), lookups are faster, and the schema stays simpler. The tradeoff is an additional infrastructure dependency.
- **Refresh token rotation** — storing refresh tokens in Redis means they can be revoked on logout. Access tokens stay stateless and short-lived to limit exposure if one leaks.
- **Per-route rate limiting** — auth routes (register, login) have stricter limits (5 req/15min) than the global limit (100 req/15min), since these are the most common targets for brute force attacks.
- **Repository pattern** — all SQL lives in `*.repository.ts` files. Services never write queries directly, which keeps business logic testable without a database and makes the database layer swappable.
- **Minimal `users` table** — only `email` and `password_hash` are included by default. This is a boilerplate, not a finished app — additional fields (name, username, avatar, etc.) are expected to be added per project.
- **UUID over auto-increment IDs** — prevents IDs from being guessable or leaking information about table size.
- **Morgan + Winston** — Morgan captures HTTP request logs, Winston handles application-level logging. In development logs are colorized and readable; in production they output JSON for log aggregators.
- **Integration tests over unit tests** — most of the logic is glue between HTTP and the database. Integration tests with a real test database catch real bugs that mocked unit tests would miss.

## Rate Limiting Note

IP-based rate limiting works correctly in local development and on a VPS. On managed platforms like Railway, the load balancer rotates IPs between requests which reduces the effectiveness of IP-based limiting. For production deployments on a VPS, configure Nginx to pass the real client IP via `X-Real-IP` and set `app.set('trust proxy', 1)` in Express.

## Docker

`docker-compose.yml` is intended for **local development only** — it spins up Postgres and Redis so you don't need anything installed locally beyond Docker and Node.

```bash
# Start dev services
docker-compose up db redis

# Start test services
docker-compose up db-test redis-test

# Start everything
docker-compose up
```

In production, this project is designed to pair managed services (Postgres + Redis) with a container host. The `Dockerfile` builds the app image; all secrets are set as environment variables on the hosting platform.

## Roadmap

- [ ] OAuth integration tests
- [ ] Role-based access control (RBAC) example
- [ ] OpenAPI/Swagger docs
- [ ] Password reset flow
- [ ] Email verification on register
