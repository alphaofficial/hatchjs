import React from 'react'
import { Head, Link } from '@inertiajs/react'

interface User {
  id: number
  name: string
  email: string
  bio: string
}

interface Props {
  user: User
}

export default function UserDetail({ user }: Props) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <Head title={`User: ${user.name}`} />
      
      <nav style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ marginRight: '1rem', color: 'blue' }}>
          Home
        </Link>
        <Link href="/users" style={{ marginRight: '1rem', color: 'blue' }}>
          ← Back to Users
        </Link>
      </nav>

      <div style={{ 
        padding: '2rem', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px' 
      }}>
        <h1>{user.name}</h1>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Bio:</strong> {user.bio}</p>
      </div>
    </div>
  )
}