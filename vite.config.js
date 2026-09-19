import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', '@inertiajs/react'],
                    'vendor-canvas': ['konva', 'react-konva'],
                    'vendor-charts': ['recharts'],
                    'vendor-icons': ['lucide-react'],
                    'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
                },
            },
        },
    },
});
