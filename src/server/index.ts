import express from 'express'
import path from 'path'
import { InertiaAdapter } from '../adapter'

const app = express()
const port = 3000

// Initialize Inertia adapter
const inertia = new InertiaAdapter({
  version: '1.0.0',
  rootView: 'app',
  title: (page) => `${page.component} - My App`
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files  
app.use('/dist', express.static(path.join(process.cwd(), 'dist')))

// Apply Inertia middleware
app.use(inertia.middleware())

// Routes
app.get('/', (req, res) => {
  res.inertia('Home', {
    message: 'Welcome to Inertia.js with Express!',
    user: { name: 'John Doe', email: 'john@example.com' }
  })
})

app.get('/about', (req, res) => {
  res.inertia('About', {
    title: 'About Us',
    description: 'This is an example Inertia.js application built with Express and React.'
  })
})

app.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
  ]
  
  res.inertia('Users', { users })
})

app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const user = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    bio: `This is the bio for user ${userId}`
  }
  
  res.inertia('UserDetail', { user })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})