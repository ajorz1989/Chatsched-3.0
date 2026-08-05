import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', open: true }), // Run to analyze bundle
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', 'zustand'],
          'vendor-ui': ['recharts', 'date-fns', 'lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    hmr: {
      overlay: false, // Less intrusive during development
    },
  },
});
