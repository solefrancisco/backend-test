const { buildNotificationController, bootstrapNotificationConsumers } = require('@notify/bootstrap/notification.bootstrap');
const { env } = require('@notify/configs/env.config');

function buildDependencies() {
    const dependencies = {};
    
    if (env.notifierEnabled) {
        dependencies.notificationController = buildNotificationController();
        bootstrapInfrastructure();
    }
    
    return dependencies;
}

async function bootstrapInfrastructure() {
    if (env.notifierEnabled) {
        await bootstrapNotificationConsumers();
    }
}


module.exports = { buildDependencies, bootstrapInfrastructure };