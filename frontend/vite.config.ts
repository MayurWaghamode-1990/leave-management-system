import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Optimize deps
      include: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled']
    })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      cors: true,
      hmr: {
        overlay: true
      }
    },
    preview: {
      port: 4173,
      host: true
    },
    build: {
      // Optimize build
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: mode === 'development',

      // Code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            charts: ['recharts'],
            utils: ['axios', 'dayjs', 'react-hot-toast']
          },
          // Optimize chunk file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },

      // Optimize bundle
      chunkSizeWarningLimit: 1600,
      assetsInlineLimit: 4096,

      // Enable gzip compression
      reportCompressedSize: true
    },
    optimizeDeps: {
      // Pre-bundle dependencies
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'axios',
        'dayjs',
        'recharts'
      ],
      // Force optimization
      force: false
    },
    define: {
      // Replace env variables in build
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __PROD__: JSON.stringify(mode === 'production'),
      __DEV__: JSON.stringify(mode === 'development'),
      // Environment variables
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001/api/v1')
    },
    esbuild: {
      // Remove console.log in production
      drop: command === 'build' ? ['console', 'debugger'] : [],
    },
  }
})