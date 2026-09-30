import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Deployed to GitHub Pages under https://mrshder.github.io/stall-wheel-system/,
// so built asset URLs need that prefix. Change to '/' for a root deploy.
export default defineConfig({
  base: '/stall-wheel-system/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**', 'work/**']
  }
});
