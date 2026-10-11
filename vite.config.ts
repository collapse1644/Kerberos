import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { proxy: { '/ws': { target: 'ws://localhost:5174', ws: true }, '/api': { target: 'http://localhost:5174' } } } });
