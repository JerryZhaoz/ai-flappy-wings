import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // If env.API_KEY is undefined, default to empty string so the code doesn't crash
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});