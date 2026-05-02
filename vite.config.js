import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

//export default defineConfig({
  //plugins: [react()],
  //base: '/wms-frontend/',  // ← This is for production (GitHub Pages)
  //build: {
  //  chunkSizeWarningLimit: 1000,
  //},
//})

export default defineConfig({
  plugins: [react()],
  // If we are building for production (GitHub), use the subfolder. 
  // Otherwise (Test/Local), use the root.
  base: process.env.NODE_ENV === 'production' ? '/wms-frontend/' : '/', 
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
