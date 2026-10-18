import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/gdelt': {
          target: 'https://api.gdeltproject.org/api/v2/doc/doc',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gdelt/, ''),
          headers: {
            'User-Agent': 'NewsScope/1.4.2 (GDELT-Proxy)',
          },
        },
      },
    },
  };
});
