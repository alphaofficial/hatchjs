# Node Inertia Express Adapter

A complete Inertia.js implementation for Node.js with Express and React.

## Features

- ✅ Modular Inertia.js adapter for Express
- ✅ TypeScript support
- ✅ React integration with @inertiajs/react  
- ✅ Asset versioning and conflict detection
- ✅ Partial reloads support
- ✅ Development workflow with hot reloading

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
├── adapter/          # Reusable Inertia.js Node.js adapter
├── server/           # Express server setup
├── client/           # React client-side code
├── pages/            # React page components
└── utils/            # Shared utilities
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

## Routes

- `/` - Home page
- `/about` - About page  
- `/users` - Users list
- `/users/:id` - User detail page

Navigate between pages to see Inertia.js in action!