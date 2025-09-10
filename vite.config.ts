import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Dev server reachable from other devices in LAN, and fixed port
  server: {
    host: true,          // binds to 0.0.0.0 (and ::) so phone/tablet v síti uvidí appku
    port: 8080,          // držíme pevně kvůli odkazům
    strictPort: true,    // když je 8080 obsazený, Vite nezvolí náhodný port
    cors: true,          // povol CORS pro případ doplňkových nástrojů
  },

  // "vite preview" (lokální prod preview) se chová stejně jako dev server
  preview: {
    host: true,
    port: 8080,
    strictPort: true,
  },

  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Konzistentní moderní target pro Vite 5 + React SWC
    target: 'es2020',
  },
}));
