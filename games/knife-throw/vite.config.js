import { defineConfig } from 'vite';

export default defineConfig({
    base: '/knife-throw/', // Served from this subdirectory
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: 'index.html'
            },
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },
    server: {
        port: 3000
    }
});
