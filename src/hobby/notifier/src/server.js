require('module-alias/register');
const { createApp } = require('../app');
const { buildDependencies, bootstrapNotificationConsumers } = require('@notify/bootstrap');
const { env } = require('@notify/configs/env.config');

async function startServer() {
    if (!env.dbEnabled) {
        console.warn('Database is disabled. Finishing server startup.');
        process.exit(0);
    }

    if (!env.rabbitMQEnabled) {
        console.warn('RabbitMQ integration is disabled. Finishing server startup.');
        process.exit(0);
    }

    const dependencies = buildDependencies();
    const app = createApp(dependencies);

    await bootstrapNotificationConsumers();

    const port = env.port || 3000;

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});