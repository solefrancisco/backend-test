require('module-alias/register');
const { createApp } = require('../app');
const { buildDependencies } = require('@apps2/bootstrap');
const { env } = require('@apps2/configs/env.config');

async function startServer() {
    if (!env.dbEnabled) {
        console.warn('Database is disabled. Finishing server startup.');
        process.exit(0);
    }

    const dependencies = await buildDependencies();
    const app = createApp(dependencies);
    const port = env.port || 3000;

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});

if (!env.dbEnabled) {
    console.warn('Database is disabled. Finishing server startup.');
    process.exit(0);
}