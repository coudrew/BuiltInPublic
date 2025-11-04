import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    // Include both app unit tests and Supabase RLS policy tests
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
      'supabase/__tests__/rls-policies/**/*.{ts,tsx}',
    ],
    // Explicitly exclude everything else
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