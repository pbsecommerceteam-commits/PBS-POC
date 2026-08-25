import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://<user>.github.io/PBS-POC/ — asset URLs must be
  // rooted under the repo name, not the domain root. Local dev is
  // unaffected: `npm run dev` still serves from /.
  base: process.env.GITHUB_ACTIONS ? '/PBS-POC/' : '/',
})
