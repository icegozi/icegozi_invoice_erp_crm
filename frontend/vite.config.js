import path from 'path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Read the single shared .env from the repo root (one folder up from frontend/)
const envDir = path.resolve(__dirname, '..');

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, envDir) };

  const proxy_url =
    process.env.VITE_DEV_REMOTE === 'remote'
      ? process.env.VITE_BACKEND_SERVER
      : 'http://localhost:8000/';

  const config = {
    plugins: [react()],
    envDir,
    resolve: {
      base: '/',
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: proxy_url,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
  return defineConfig(config);
};
