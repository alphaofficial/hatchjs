export function resolvePageComponent(name: string, pages: Record<string, any>) {
  for (const path in pages) {
    if (path.includes(`/${name}.tsx`)) {
      return pages[path]()
    }
  }
  throw new Error(`Page not found: ${name}. Available pages: ${Object.keys(pages).join(', ')}`)
}