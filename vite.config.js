import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleChatRequest } from './netlify/functions/chat.mts'

// In production Netlify runs netlify/functions/chat.mts for us. `vite dev`
// doesn't know about Netlify functions, so we mount the exact same handler as
// dev-server middleware — that way `npm run dev` works without the Netlify CLI
// and there's only one copy of the Gemini logic.
function chatApiDevServer() {
  return {
    name: 'chat-api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next()

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)

          const response = await handleChatRequest(
            new Request('http://localhost/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: Buffer.concat(chunks),
            }),
          )

          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))

          if (response.body) {
            const reader = response.body.getReader()
            for (;;) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
          }

          res.end()
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite only puts VITE_-prefixed vars on import.meta.env, and deliberately so.
  // The handler reads process.env.GEMINI_API_KEY (as it will on Netlify), so
  // load .env ourselves and put the key there for local dev.
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY

  return {
    plugins: [react(), chatApiDevServer()],
  }
})
