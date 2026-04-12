const { buildNotificationController, bootstrapNotificationConsumers } = require('@notify/bootstrap/notification.bootstrap');
const { env } = require('@notify/configs/env.config');

async function buildDependencies() {
    const dependencies = {};
    
    if (env.notifierEnabled) {
        dependencies.notificationController = buildNotificationController();
        await bootstrapNotificationConsumers();
    }
    
    return dependencies;
}


module.exports = { buildDependencies, bootstrapNotificationConsumers };