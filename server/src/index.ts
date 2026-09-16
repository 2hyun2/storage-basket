import 'dotenv/config'
import { createApp } from './app.js'
import './supabase.js'

const port = Number(process.env.PORT ?? 3000)
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const app = createApp(clientOrigin)

app.listen(port, '0.0.0.0', () => {
  console.log(`Storage Basket API is listening on http://localhost:${port}`)
})
