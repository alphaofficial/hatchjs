import React from 'react'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '../utils/resolve-page-component'

createInertiaApp({
  resolve: (name) => resolvePageComponent(name, import.meta.glob('../pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el)
    root.render(<App {...props} />)
  },
  progress: {
    color: '#4B5563',
  },
})