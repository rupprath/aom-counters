/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Single config shared by Vite (dev/build), Tauri (via `npm run dev`), and
// Vitest. Tauri requires a fixed dev-server port.

// The app version, taken from package.json so it is defined in one place.
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
