require('module-alias/register');
const { createApp } = require('../app');
const { buildDependencies } = require('@apps2/bootstrap');
const { env } = require('@apps2/configs/env.config');

async function startServer() {
    if (!env.dbEnabled) {
        console.warn('Database is disabled. Finishing server startup.');
        process.exit(0);
    }

    if (env.environment === 'production') {
        console.log('Running in production mode. All database operations will be mirrored to test database...');
    }

    const dependencies = buildDependencies();
    const app = createApp(dependencies);
    const port = env.port;

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});
