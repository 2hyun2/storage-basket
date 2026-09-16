import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { errorHandler } from './errorHandler.js'
import { healthRouter } from './health.js'
import { itemsRouter } from './items.js'
import { locationsRouter } from './locations.js'

export const createApp = (clientOrigin: string) => {
  const app = express()

  app.use(cors({ origin: clientOrigin }))
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/locations', locationsRouter)
  app.use('/api/items', itemsRouter)
  app.use('/api', (_, response) => response.status(404).json({ error: { message: '요청한 API를 찾을 수 없어요.' } }))

  const frontDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../front/dist')
  if (existsSync(frontDist)) {
    app.use(express.static(frontDist))
    app.get('/{*path}', (_, response) => response.sendFile(resolve(frontDist, 'index.html')))
  }
  app.use(errorHandler)

  return app
}
