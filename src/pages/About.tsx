import React from 'react'
import { Head, Link } from '@inertiajs/react'

interface Props {
  title: string
  description: string
}

export default function About({ title, description }: Props) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <Head title="About" />
      
      <h1>{title}</h1>
      <p>{description}</p>
      
      <nav style={{ marginTop: '2rem' }}>
        <Link href="/" style={{ marginRight: '1rem', color: 'blue' }}>
          Home
        </Link>
        <Link href="/users" style={{ color: 'blue' }}>
          Users
        </Link>
      </nav>
    </div>
  )
}