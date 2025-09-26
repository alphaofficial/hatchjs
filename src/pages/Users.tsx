import React from 'react'
import { Head, Link } from '@inertiajs/react'

interface User {
  id: number
  name: string
  email: string
}

interface Props {
  users: User[]
}

export default function Users({ users }: Props) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <Head title="Users" />
      
      <h1>Users</h1>
      
      <nav style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ marginRight: '1rem', color: 'blue' }}>
          Home
        </Link>
        <Link href="/about" style={{ color: 'blue' }}>
          About
        </Link>
      </nav>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {users.map(user => (
          <div key={user.id} style={{ 
            padding: '1rem', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px' 
          }}>
            <h3>
              <Link href={`/users/${user.id}`} style={{ color: 'blue' }}>
                {user.name}
              </Link>
            </h3>
            <p>{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  )
}