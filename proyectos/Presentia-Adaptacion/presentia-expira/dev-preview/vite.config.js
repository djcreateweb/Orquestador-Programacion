import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Preview dev-only: sirve la app y hace proxy de /presentia al servidor de API real.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: ['..'] }, // permite importar ../manager, ../kiosk, ../shared
    proxy: {
      '/presentia': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
});
