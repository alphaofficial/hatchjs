import React from 'react'
import { Head, Link } from '@inertiajs/react'

interface Props {
  message: string
  user: {
    name: string
    email: string
  }
}

export default function Home({ message, user }: Props) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <Head title="Home" />
      
      <h1>Home Page</h1>
      <p>{message}</p>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Welcome, {user.name}!</h2>
        <p>Email: {user.email}</p>
      </div>

      <nav style={{ marginBottom: '2rem' }}>
        <Link href="/about" style={{ marginRight: '1rem', color: 'blue' }}>
          About
        </Link>
        <Link href="/users" style={{ marginRight: '1rem', color: 'blue' }}>
          Users
        </Link>
      </nav>

      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h3>🎉 Inertia.js is working!</h3>
        <p>This page was rendered using React with server-side data from Express.</p>
      </div>
    </div>
  )
}