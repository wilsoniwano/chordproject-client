import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    resolve: {
        alias: {
            app: fileURLToPath(new URL('./src/app', import.meta.url)),
            domain: fileURLToPath(new URL('./src/domain', import.meta.url)),
            application: fileURLToPath(new URL('./src/application', import.meta.url)),
            infra: fileURLToPath(new URL('./src/infra', import.meta.url)),
        },
    },
    test: {
        include: ['src/**/*.spec.ts'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/domain/**/*.ts', 'src/application/**/*.ts', 'src/infra/**/*.ts'],
        },
    },
});
