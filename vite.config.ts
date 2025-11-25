import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,        // disable source maps in production (for smaller, safer builds)
    outDir: 'dist',          // output directory
    assetsDir: 'assets',     // put assets inside /assets folder
  },
  server: {
    port: 5173,              // dev server port (you can change if needed)
    open: true,              // auto open browser when running `npm run dev`
  },
  preview: {
    port: 4173,              // vite preview port
    open: true,              // auto open preview page
  },
  // Use absolute base so deep-linked routes load assets correctly (e.g., /destination/:id)
  base: '/',                
})
