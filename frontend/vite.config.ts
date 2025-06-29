import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

export default async ({ mode }: UserConfig) => {
  // @ts-expect-error - Vite does not have types for this
  import.meta.env = loadEnv(mode, process.cwd());
  await import('./src/env');

  const __dirname = fileURLToPath(new URL('.', import.meta.url));

  return defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  });
};
