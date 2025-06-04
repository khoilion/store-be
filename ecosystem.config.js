module.exports = {
    apps: [{
        name: 'store-be',
        script: 'bun',
        args: 'run src/index.ts',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            JWT_SECRET: 'secretfjsdlkfjasdk1dsakljsdkldsfa',
            DATABASE_URL: 'mongodb://localhost:27017/elysia-mikro-orm',
            PORT: 3000
        }
    }]
}