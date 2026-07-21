import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.resolve(frontendDir, '..');

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, envDir) };

  const proxy_url =
    process.env.VITE_DEV_REMOTE === 'remote'
      ? process.env.VITE_BACKEND_SERVER
      : 'http://localhost:8000/';

  return defineConfig({
    plugins: [react()],
    envDir,
    resolve: {
      base: '/',
      alias: { '@': path.resolve(frontendDir, 'src') },
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': { target: proxy_url, changeOrigin: true, secure: false },
      },
    },
  });
};
