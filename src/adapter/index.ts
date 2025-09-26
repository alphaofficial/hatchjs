import { Request, Response, NextFunction } from 'express'
import fs from 'fs-extra'
import path from 'path'

export interface InertiaPageObject {
  component: string
  props: Record<string, any>
  url: string
  version: string
}

export interface InertiaConfig {
  version?: string | (() => string)
  rootView: string
  title?: string | ((page: InertiaPageObject) => string)
  manifestPath?: string
}

const HEADERS = {
  INERTIA: 'X-Inertia',
  INERTIA_VERSION: 'X-Inertia-Version',
  INERTIA_LOCATION: 'X-Inertia-Location',
  INERTIA_PARTIAL_DATA: 'X-Inertia-Partial-Data',
  INERTIA_PARTIAL_COMPONENT: 'X-Inertia-Partial-Component',
}

export class InertiaAdapter {
  private config: InertiaConfig
  private manifest: any = null

  constructor(config: InertiaConfig) {
    this.config = config
    this.loadManifest()
  }

  private loadManifest() {
    try {
      const manifestPath = this.config.manifestPath || path.join(process.cwd(), 'dist/client/.vite/manifest.json')
      if (fs.existsSync(manifestPath)) {
        this.manifest = fs.readJsonSync(manifestPath)
      }
    } catch (error) {
      console.warn('Could not load Vite manifest:', error)
    }
  }

  private getAssetUrl(entry: string): string {
    if (this.manifest && this.manifest[entry]) {
      return `/dist/client/${this.manifest[entry].file}`
    }
    // Fallback for development
    return `/dist/client/${entry}`
  }

  private getVersion(): string {
    if (typeof this.config.version === 'function') {
      return this.config.version()
    }
    return this.config.version || '1'
  }

  private isInertiaRequest(req: Request): boolean {
    return req.headers[HEADERS.INERTIA.toLowerCase()] === 'true'
  }

  private getTitle(page: InertiaPageObject): string {
    if (typeof this.config.title === 'function') {
      return this.config.title(page)
    }
    return this.config.title || 'Inertia App'
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check for version mismatch
      const currentVersion = this.getVersion()
      const clientVersion = req.headers[HEADERS.INERTIA_VERSION.toLowerCase()] as string

      if (this.isInertiaRequest(req) && clientVersion && clientVersion !== currentVersion) {
        return res.status(409).set(HEADERS.INERTIA_LOCATION, req.originalUrl).end()
      }

      // Add render method to response
      res.inertia = (component: string, props: Record<string, any> = {}) => {
        const page: InertiaPageObject = {
          component,
          props,
          url: req.originalUrl,
          version: currentVersion
        }

        if (this.isInertiaRequest(req)) {
          // Handle partial reloads
          const partialData = req.headers[HEADERS.INERTIA_PARTIAL_DATA.toLowerCase()] as string
          const partialComponent = req.headers[HEADERS.INERTIA_PARTIAL_COMPONENT.toLowerCase()] as string

          if (partialData && partialComponent === component) {
            const only = partialData.split(',').map(key => key.trim())
            const filteredProps: Record<string, any> = {}
            
            only.forEach(key => {
              if (key in props) {
                filteredProps[key] = props[key]
              }
            })
            
            page.props = filteredProps
          }

          return res
            .status(200)
            .set({
              'Content-Type': 'application/json',
              [HEADERS.INERTIA]: 'true',
              'Vary': 'Accept'
            })
            .json(page)
        }

        // First visit - return HTML
        const title = this.getTitle(page)
        const appScript = this.getAssetUrl('src/client/app.tsx')
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script type="module" src="${appScript}"></script>
</head>
<body>
    <div id="app" data-page='${JSON.stringify(page).replace(/'/g, '&apos;')}'></div>
</body>
</html>`

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.send(html)
      }

      next()
    }
  }
}

// Extend Express Response interface
declare module 'express-serve-static-core' {
  interface Response {
    inertia(component: string, props?: Record<string, any>): void
  }
}