import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // NOVI Dynamic API staat alleen CORS toe vanaf localhost:5173 (of 3000)
  server: {
    port: 5173,
    strictPort: true,
  },
})
