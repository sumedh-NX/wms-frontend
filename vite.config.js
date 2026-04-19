import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/wms-frontend/',  // ← THIS LINE IS CRITICAL
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
