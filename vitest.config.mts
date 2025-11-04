import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [['supabase/**', 'node']],
    // Only include app unit tests
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
      'supabase/__tests__/rls-policies/**/*.{test,spec}.{ts,tsx,js}',
    ],
    // Explicitly exclude any Supabase policy tests
    exclude: ['node_modules', 'dist', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      // optional: enforce a basic gate
      // thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
