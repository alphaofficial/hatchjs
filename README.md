[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node Version](https://img.shields.io/badge/node-22%2B-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

# Hatch JS

A batteries-included fullstack starter built on **Express 5**, **Inertia.js**, **React 19**, **MikroORM**, and **Tailwind CSS**. Server-rendered React without an API layer — pass props from Express controllers straight into React pages.

📖 **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** — how to add pages, controllers, models, migrations, auth, and more.

## Prerequisites

- **Node.js 22+** — download from [nodejs.org](https://nodejs.org/)
- **npm** — ships with Node.js
- **PostgreSQL** *(optional)* — required only for the background job queue ([Graphile Worker](https://worker.graphile.org/)). The queue gracefully no-ops when `DATABASE_URL` is not set, so PostgreSQL is not needed for general development.

## Quick start

Interactive scaffold (recommended):

```bash
curl -fsSL https://raw.githubusercontent.com/alphaofficial/hatchjs/main/install.sh | bash
```

Non-interactive (defaults, fastest):

```bash
curl -fsSL https://raw.githubusercontent.com/alphaofficial/hatchjs/main/install.sh | bash -s -- --quick my-app
```

Flags: `--quick`, `--branch <name>`, `--no-install`, `--no-git`.

### Manual clone and run

If you prefer not to pipe curl to bash:

```bash
git clone https://github.com/alphaofficial/hatchjs.git my-app
cd my-app
cp env.example .env
npm install
npm run dev
```

## Architecture

Hatch JS uses [Inertia.js](https://inertiajs.com/) to bridge Express and React — no separate API layer. Every request flows through a single pipeline:

```
Browser request
  → Express router (src/routes/)
    → Middleware (session, auth, Inertia)
      → Controller (src/controllers/)
        → res.inertia('Page', props)
          → React page (src/views/pages/)
            → Full HTML response (first visit) or JSON props (subsequent navigation)
```

On the first visit the server returns a full HTML document with the initial page component and props embedded. Subsequent navigations are handled client-side by Inertia — the browser sends XHR requests and receives only the updated page component name and props as JSON, avoiding full page reloads.

## What's included

- **Inertia SSR adapter** — `res.inertia('Page', props)` from any controller
- **Auth & sessions** — bcrypt, DB-backed sessions, `req.user()` / `req.is_authenticated()`, `auth`/`guest` route guards
- **Complete auth flows** — forgot password, password reset, and email verification with the `verified` middleware
- **MikroORM** — SQLite by default, Postgres-ready, migrations, EntitySchema mappings (no decorators)
- **Production hardening** — Helmet, gzip compression, `/healthz` + `/readyz`, graceful shutdown, structured Pino logs, HTML-escaped page props
- **Configurable rate limiting** — off by default, opt-in via env
- **Queue** — Graphile Worker (`npm run work`), Postgres required; dispatch jobs with `Queue.dispatch('jobName', payload)`
- **Mailer** — log + SMTP drivers; send mail with `Mailer.send(to, subject, html)`
- **Task Scheduler** — node-cron (`npm run scheduler`); register recurring tasks with `Scheduler.schedule('0 * * * *', handler)`
- **Typed Event Bus** — `Emitter.on` / `Emitter.emit` with type-safe `HatchEvents` interface
- **In-memory Cache** — `Cache.get / set / delete / flush` with optional TTL
- **File Storage** — local + memory drivers; `Storage.put / get / delete / url`; swap drivers via env
- **Tailwind CSS** + Vite client build
- **Integration test suite** — supertest + jest, runs against a real SQLite DB
- **Playwright E2E test suite** — `npm run test:e2e`, runs against a real server with a browser

## Scripts

| Command                      | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `npm run dev`                | Start Express server + Vite watch            |
| `npm run build`              | Production build (client + server)           |
| `npm start`                  | Run built server (`dist/index.js`)           |
| `npm test`                   | Run integration + E2E tests                  |
| `npm run test:integration`   | Run integration tests (Jest + supertest)     |
| `npm run test:e2e`           | Run Playwright E2E tests                     |
| `npm run work`               | Start the Graphile Worker queue worker       |
| `npm run scheduler`          | Start the node-cron task scheduler           |
| `npm run migrate`            | Generate + apply migrations                  |
| `npm run migration:run`      | Apply pending migrations                     |
| `npm run migration:revert`   | Revert the last applied migration            |
| `npm run migration:create`   | Create a blank migration                     |
| `npm run migration:status`   | Show pending / applied migration status      |
| `npm run db:seed`            | Run seeders                                  |
| `npm run scaffold -- ...`    | Generate pages, controllers, routes          |

## Project structure

```
src/
├── adapters/         # Inertia.js Express adapter
├── controllers/      # Route controllers (BaseController + per-feature)
├── database/         # MikroORM config, migrations, mappings, seeders
├── jobs/             # Graphile Worker job handlers (one file per job name)
├── lib/              # Core service singletons (Cache, Emitter, Mailer, Queue, Storage)
├── logger/           # Pino logger instance and configuration
├── mail/             # Mailer class, driver interface, log + SMTP driver implementations
├── middleware/       # auth, sessions, errorHandler, rateLimit, inertia
├── models/           # Domain classes (User, Session)
├── routes/           # Express router
├── utils/            # Shared utility helpers (tokens, hashing, etc.)
├── views/            # React pages + components (Vite-bundled)
├── config/           # Env validation (Zod), autogenerated page registry
└── index.ts          # App bootstrap, helmet, healthz, graceful shutdown
```

## Environment variables

| Variable                    | Default                 | Notes                                                            |
| --------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                  | `development`           | `development` \| `production` \| `test`                          |
| `PORT`                      | `3000`                  |                                                                  |
| `APP_URL`                   | `http://localhost:3000` | Public URL of the app                                            |
| `TRUST_PROXY`               | `loopback`              | Set to your LB CIDR (or `true`) when behind a reverse proxy      |
| `SESSION_SECRET`            | _(dev only default)_    | **Required in production.** Generate with `openssl rand -hex 32` |
| `SESSION_MAX_AGE`           | `86400000`              | Session lifetime in ms (24h default)                             |
| `APP_NAME`                  | `Hatch JS`              | Display name shown in the UI and `<title>`                       |
| `DB_PATH`                   | `hatch.db`              | SQLite file path                                                 |
| `APP_KEY`                       | _(dev only default)_    | **Required in production.** Used for HMAC token signing. Generate with `openssl rand -hex 32` |
| `RATE_LIMIT_ENABLED`            | `false`                 | Enable per-IP limiter on `/login` and `/register`                                             |
| `RATE_LIMIT_AUTH_MAX`           | `5`                     | Max requests per window on auth routes                                                        |
| `RATE_LIMIT_AUTH_WINDOW_MS`     | `60000`                 | Window size in ms for auth rate limiter                                                       |
| `RATE_LIMIT_FEATURE_MAX`        | `60`                    | Max requests per window on feature routes                                                     |
| `RATE_LIMIT_FEATURE_WINDOW_MS`  | `60000`                 | Window size in ms for feature rate limiter                                                    |
| `PASSWORD_RESET_EXPIRY`         | `60`                    | Password-reset token expiry in minutes                                                        |
| `EMAIL_VERIFICATION_EXPIRY`     | `60`                    | Email-verification token expiry in minutes                                                    |
| `MAIL_DRIVER`                   | `log`                   | Mail transport: `log` (stdout) or `smtp`                                                      |
| `MAIL_FROM`                     | `noreply@example.com`   | Sender address used in all outgoing emails                                                    |
| `MAIL_HOST`                     | _(none)_                | SMTP hostname — required when `MAIL_DRIVER=smtp`                                              |
| `MAIL_PORT`                     | `587`                   | SMTP port                                                                                     |
| `MAIL_USER`                     | _(none)_                | SMTP username                                                                                 |
| `MAIL_PASS`                     | _(none)_                | SMTP password                                                                                 |
| `CACHE_DRIVER`                  | `memory`                | Cache backend driver (built-in: `memory`)                                                     |
| `STORAGE_DRIVER`                | `local`                 | File-storage driver: `local` (disk) or `memory`                                               |
| `STORAGE_PATH`                  | `storage`               | Root directory for the `local` storage driver                                                 |
| `DATABASE_URL`                  | _(none)_                | PostgreSQL connection URL — required to enable the Queue (Graphile Worker)                    |
| `SCHEDULER_ENABLED`             | `false`                 | Set to `true` to activate the cron-based task scheduler                                       |

## Authentication helpers

Available on every `req`:

```ts
req.is_authenticated(): boolean
req.is_guest(): boolean
req.user_id(): string | null
req.user(): Promise<User | null>
req.authenticate(user: User): void
req.logout(): Promise<void>
```

### Route guards

Three middleware guards live in `src/middleware/auth.ts`:

| Guard      | Behaviour                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `auth`     | Redirects unauthenticated users to `/login`                                                    |
| `guest`    | Redirects authenticated users to `/home`                                                       |
| `verified` | Requires auth **and** a verified email; redirects unverified users to `/verify-email`          |

```ts
import { auth, guest, verified } from '../middleware/auth';

route.get('/dashboard', verified, DashboardController.show); // auth + verified
route.get('/settings',  auth,     SettingsController.show);  // auth only
route.get('/login',     guest,    AuthController.showLogin);  // guests only
```

### Auth flows

| Route | Method | Guard | Description |
| ----- | ------ | ----- | ----------- |
| `/forgot-password` | GET | `guest` | Render the forgot-password form |
| `/forgot-password` | POST | `guest` | Send a password-reset email |
| `/reset-password/:token` | GET | `guest` | Render the reset-password form |
| `/reset-password` | POST | `guest` | Validate token and update password |
| `/verify-email` | GET | `auth` | Render the email-verification notice page |
| `/verify-email/:token` | GET | `auth` | Verify the token and mark email as verified |
| `/email/resend-verification` | POST | `auth` | Re-send the verification email |

## Queue

Background jobs are powered by **[Graphile Worker](https://worker.graphile.org/)** and require a **PostgreSQL** database (`DATABASE_URL`).

```ts
import { Queue } from './lib/queue';

// Dispatch a job from anywhere in the application
await Queue.dispatch('send-welcome-email', { to: 'user@example.com', name: 'Alice' });
```

Jobs live in `src/jobs/`. Each file exports an `async` function that receives the typed payload:

```ts
// src/jobs/sendWelcomeEmail.ts
export async function sendWelcomeEmail(payload: unknown): Promise<void> {
  const { to, name } = payload as { to: string; name?: string };
  // ... send the email
}
```

Register jobs and start the worker in `src/worker.ts`, then run:

```bash
npm run work
```

> **Note:** If `DATABASE_URL` is not set, `Queue.dispatch` is a safe no-op (logs a warning) so the rest of the app continues to work with SQLite.

## Mailer

Send transactional email via `Mailer.send`:

```ts
import { Mailer } from './lib/mail';

await Mailer.send('user@example.com', 'Welcome!', '<p>Thanks for signing up.</p>');
```

The active driver is selected by the `MAIL_DRIVER` env var:

| Driver | Description                                              |
| ------ | -------------------------------------------------------- |
| `log`  | Writes mail to the application log (default, no config) |
| `smtp` | Sends via SMTP — requires `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` |

Register a custom driver at boot time:

```ts
import { Mailer, MailTransport, MailMessage } from './lib/mail';

class PostmarkTransport implements MailTransport {
  async sendMail(message: MailMessage): Promise<void> {
    // call Postmark API …
  }
}

Mailer.registerDriver('postmark', new PostmarkTransport());
// then set MAIL_DRIVER=postmark in your env
```

## Scheduler

Register recurring tasks with a cron expression via `Scheduler.schedule`:

```ts
import { Scheduler } from './lib/scheduler';

Scheduler.schedule('0 * * * *', async () => {
  // runs at the start of every hour
  await cleanUpExpiredSessions();
});
```

Start the scheduler process:

```bash
npm run scheduler
```

> **Note:** Set `SCHEDULER_ENABLED=true` in your env to allow the scheduler worker to start tasks. The `SCHEDULER_ENABLED` flag has no effect on `Scheduler.schedule` registration — tasks are registered at import time and only start when `Scheduler.startAll()` is called (done automatically by `npm run scheduler`).

## Events

A typed in-process event bus backed by Node's `EventEmitter`. Built-in events (`user.registered`, `user.login`, `user.verified`) are defined in `HatchEvents`. Extend the interface to add your own:

```ts
import { Emitter, HatchEvents } from './lib/events';

// Extend HatchEvents for custom typed events
declare module './lib/events' {
  interface HatchEvents {
    'order.placed': { orderId: string; total: number };
  }
}

// Listen
Emitter.on('order.placed', ({ orderId, total }) => {
  console.log(`Order ${orderId} placed for $${total}`);
});

// Emit
Emitter.emit('order.placed', { orderId: 'abc-123', total: 49.99 });

// Remove a listener
Emitter.off('order.placed', handler);
```

> **Note:** Events are synchronous and in-process — listeners run immediately in the same Node.js event loop tick. For async/background work, dispatch a Queue job from within the listener.

## Cache

A simple key/value cache backed by an in-process `memory` driver (default). Switch drivers with the `CACHE_DRIVER` env var.

```ts
import { Cache } from './lib/cache';

// Store a value (no expiry)
await Cache.set('user:42', { name: 'Alice' });

// Store with a TTL (seconds)
await Cache.set('session:token', 'abc123', 300); // expires in 5 minutes

// Retrieve a value (returns undefined if missing or expired)
const user = await Cache.get<{ name: string }>('user:42');

// Delete a single key
await Cache.delete('user:42');

// Clear the entire cache
await Cache.flush();
```

Register a custom driver that implements the `CacheDriver` interface:

```ts
import { Cache, CacheDriver } from './lib/cache';

class RedisCacheDriver implements CacheDriver {
    async get<T>(key: string): Promise<T | undefined> { /* ... */ }
    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> { /* ... */ }
    async delete(key: string): Promise<void> { /* ... */ }
    async flush(): Promise<void> { /* ... */ }
}

Cache.registerDriver('redis', new RedisCacheDriver());
// then set CACHE_DRIVER=redis in your env
```

## Storage

File storage backed by a `local` driver (default) or an in-process `memory` driver. Switch drivers with the `STORAGE_DRIVER` env var. The local driver writes files under the `STORAGE_PATH` directory and serves them at `/storage/<path>`.

```ts
import { Storage } from './lib/storage';

// Write a file
await Storage.put('uploads/avatar.png', imageBuffer);

// Read a file back
const data: Buffer = await Storage.get('uploads/avatar.png');

// Delete a file
await Storage.delete('uploads/avatar.png');

// Get the public URL for a file
const publicUrl: string = Storage.url('uploads/avatar.png');
// → http://localhost:3000/storage/uploads/avatar.png

// Check whether a file exists
const exists: boolean = await Storage.exists('uploads/avatar.png');
```

| Driver  | Description                                       | Notes                                      |
| ------- | ------------------------------------------------- | ------------------------------------------ |
| `local` | Writes to disk under `STORAGE_PATH` (default `storage/`) | Set `STORAGE_DRIVER=local` (default)  |
| `memory` | Stores files in-process memory                   | Useful for tests; data lost on restart     |

Register a custom driver that implements the `StorageDriver` interface:

```ts
import { Storage, StorageDriver } from './lib/storage';

class S3Driver implements StorageDriver {
    async put(filePath: string, data: Buffer | string): Promise<void> { /* ... */ }
    async get(filePath: string): Promise<Buffer> { /* ... */ }
    async delete(filePath: string): Promise<void> { /* ... */ }
    url(filePath: string): string { return `https://cdn.example.com/${filePath}`; }
    async exists(filePath: string): Promise<boolean> { /* ... */ }
}

Storage.registerDriver('s3', new S3Driver());
// then set STORAGE_DRIVER=s3 in your env
```

## Render an Inertia page

```ts
// Controller
res.inertia('Home', {
  message: 'Hello from Express',
  user: await req.user(),
});
```

```tsx
// src/views/pages/Home.tsx
export default function Home({ message, user }: Props) {
  return <h1>{message}, {user?.name}</h1>;
}
```

`src/config/pages.ts` is autogenerated from `src/views/pages/**/*.tsx` — drop a new `.tsx` file and the `PageName` union updates automatically (live in `npm run dev` via the chokidar watcher, or one-shot via the `predev`/`prebuild` hook).

Skip the boilerplate with the scaffold script:

```bash
npm run scaffold -- page Posts                     # controller + page + GET /posts
npm run scaffold -- page Auth/Profile /profile     # nested page at an explicit path
npm run scaffold -- controller Billing             # controller only
npm run scaffold -- route post /posts Posts.create --auth
npm run scaffold -- model Post --fields "title:string,body:text,publishedAt:datetime?"
npm run scaffold -- page Post --model --fields "title:string,body:text"
```

## Database

This project uses **MikroORM** with the **EntitySchema** pattern mapped to plain domain classes — no decorators. See `src/database/mappings/` and `src/models/`.

Switch to Postgres by changing `src/database/orm.config.ts` to use `@mikro-orm/postgresql` and setting connection env vars.

## Testing

```bash
npm test              # integration + E2E
npm run test:integration  # Jest + supertest only
npm run test:e2e          # Playwright browser tests only
```

### Integration tests (Jest + supertest)

Boot the full Express stack against a real SQLite database. Suites under `test/integration/requests/`:

| Suite | What it covers |
|---|---|
| `auth.spec.ts` | Login, register, logout, forgot-password, reset-password, email verification |
| `pages.spec.ts` | Public / auth / user pages — rendering, redirects, validation |
| `hardening.spec.ts` | Helmet headers, rate limiter, body-size limit, XSS guard, error handler |
| `cache.spec.ts` | `Cache.get / set / delete / flush`, TTL expiry, memory driver |
| `events.spec.ts` | `Emitter.on / emit / off`, typed events via `HatchEvents` |
| `mail.spec.ts` | `Mailer.send` with log driver; `MAIL_DRIVER` switching |
| `queue.spec.ts` | `Queue.dispatch` no-op when `DATABASE_URL` unset, payload shape |
| `storage.spec.ts` | `Storage.put / get / delete / url / exists`, local and memory drivers |

### E2E tests (Playwright)

Spin up a real browser against a built frontend. Suites under `test/integration/playwright/`:

- `auth.spec.ts` — full UI flows: register → verify-email redirect, login/logout, invalid credentials, forgot-password page

See `test/integration/` for all test source files.

## Deployment

### Docker

The included `Dockerfile` builds a production image with PM2 as the process manager.

```bash
# Build the image
docker build -t hatch-app .

# Run the container
docker run -d -p 3000:3000 --env-file .env hatch-app
```

The image installs dependencies, compiles TypeScript, builds the Vite frontend, and starts the app via `pm2-runtime`. Port 3000 is exposed by default.

### PM2 cluster mode

The `ecosystem.config.js` runs the compiled app (`./dist/index.js`) in PM2 cluster mode. Default settings:

| Option | Value | Notes |
|---|---|---|
| `exec_mode` | `cluster` | Spreads across available CPUs |
| `instances` | `1` | Increase to match your CPU count |
| `max_memory_restart` | `1G` | Auto-restarts if memory exceeds 1 GB |
| `autorestart` | `true` | Restarts on crash |

To scale across all CPUs, set `instances` to `"max"` or a specific number in `ecosystem.config.js`.

The Docker image also configures `pm2-logrotate` to rotate logs at 5 MB, retain one backup, and compress rotated files every three days.

## Production checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `APP_KEY` (`openssl rand -hex 32`) — used for HMAC token signing
- [ ] Set `SESSION_SECRET` (`openssl rand -hex 32`)
- [ ] Set `TRUST_PROXY` to match your reverse proxy
- [ ] Mount a persistent volume for the SQLite file (or move to Postgres)
- [ ] Run `npm run build && npm run migration:run` on deploy
- [ ] Optionally enable `RATE_LIMIT_ENABLED=true` if your edge doesn't already rate-limit
- [ ] Point liveness probe at `/healthz`, readiness at `/readyz`

## Dependencies

For a full breakdown of every dependency and why it's included, see the [Developer Guide](./docs/DEVELOPER_GUIDE.md).

## License

MIT — see [LICENSE](./LICENSE).
