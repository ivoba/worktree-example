import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.API_URL || 'http://localhost:8080';
  const frontendPort = parseInt(env.FRONTEND_PORT || '5173', 10);

  return {
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/health': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
