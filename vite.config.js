import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ao publicar no GitHub Pages (projeto), a base precisa ser "/collanote/".
// Localmente e em outros hosts, fica "/".
const base = process.env.GH_PAGES === 'true' ? '/collanote/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
});
