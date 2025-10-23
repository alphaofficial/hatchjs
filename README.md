# Node Inertia Express Adapter

Inertia.js implementation for Node.js with Express and React.

## Getting Started

### Development

```bash
npm run dev
```

This starts both the Express server and Vite build watcher.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── adapters/         # Reusable Inertia.js Node.js adapter
├── controllers/      # Express route controllers
├── database/         # Database configuration, migrations, and mappings
├── middleware/       # Express middleware (auth, session, etc.)
├── models/           # Database models
├── views/            # React components and pages
└── utils/            # Shared utilities
```

## Authentication Utilities

The application provides authentication utilities available on the Express request object:

### Available Methods

```typescript
// Check if user is authenticated
req.is_authenticated(): boolean

// Check if user is guest (not authenticated)
req.is_guest(): boolean

// Get current user ID
req.user_id(): string | null

// Get current user object
req.user(): Promise<User | null>

// Authenticate a user (login)
req.authenticate(user: User): void

// Logout current user
req.logout(): Promise<void>
```

### Usage Example

```typescript
// In your controller
app.post('/login', async (req, res) => {
  const user = await authenticateCredentials(req.body.email, req.body.password);

  if (user) {
    req.authenticate(user);
    return res.redirect('/dashboard');
  }

  return res.redirect('/login');
});

app.post('/logout', async (req, res) => {
  await req.logout();
  res.redirect('/');
});

app.get('/profile', async (req, res) => {
  if (req.is_guest()) {
    return res.redirect('/login');
  }

  const user = await req.user();
  res.inertia('Profile', { user });
});
```

## Session Management

### Database Session Storage

Sessions are stored in your configured database (SQLite, PostgreSQL, MySQL, etc.). The session store automatically:

- Stores session data in the `sessions` table
- Tracks user authentication state
- Records IP address and User-Agent for security
- Handles session expiration (24 hours by default)
- Persists sessions across server restarts

### Session Table Schema

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,           -- Session ID
  user_id TEXT,                 -- Authenticated user ID (nullable)
  ip_address TEXT,              -- Client IP address (nullable)
  user_agent TEXT,              -- Client User-Agent (nullable)
  payload TEXT NOT NULL,        -- Serialized session data
  last_activity INTEGER NOT NULL -- Unix timestamp
);
```

### Configuration

Session configuration is handled in `src/index.ts`:

```typescript
app.use(session({
  store: new SessionStore(orm),  // Uses your configured database
  secret: variables.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: variables.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: variables.SESSION_MAX_AGE,
  }
}));
```

### Global Authentication State

Authentication state is automatically shared with all Inertia pages via middleware. This means you can access user authentication status in any React component:

```typescript
import { usePage } from '@inertiajs/react';

export default function MyComponent() {
  const { auth } = usePage().props;

  return (
    <div>
      {auth.isAuthenticated ? (
        <p>Welcome, {auth.user.name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Usage

### Server-side (Express)

```typescript
import { InertiaAdapter } from './adapter'

const inertia = new InertiaAdapter({
  version: '1.0.0',
  rootView: 'app',
  title: (page) => `${page.component} - My App`
})

app.use(inertia.middleware())

app.get('/', (req, res) => {
  res.inertia('Home', { message: 'Hello World!' })
})
```

### Client-side (React)

```typescript
// pages/Home.tsx
import { Head, Link } from '@inertiajs/react'

export default function Home({ message }) {
  return (
    <div>
      <Head title="Home" />
      <h1>{message}</h1>
      <Link href="/about">About</Link>
    </div>
  )
}
```

Navigate between pages to see Inertia.js in action!

https://v3.tailwindcss.com/docs/installation