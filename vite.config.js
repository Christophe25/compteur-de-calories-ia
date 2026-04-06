import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use '/' on local development and Vercel, but the repository name on GitHub Pages
  base: process.env.GITHUB_ACTIONS ? '/compteur-de-calories-ia/' : '/',
})
