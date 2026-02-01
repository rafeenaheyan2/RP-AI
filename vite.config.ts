import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Priority: 1. .env file (env.API_KEY), 2. System environment (process.env.API_KEY)
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
    },
    server: {
      port: 3000,
    }
  };
});