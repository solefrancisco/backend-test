const { buildNotificationController, bootstrapNotificationConsumers } = require('@notify/bootstrap/notification.bootstrap');
const { env } = require('@notify/configs/env.config');

function buildDependencies() {
    const dependencies = {};
    
    if (env.notifierEnabled) {
        dependencies.notificationController = buildNotificationController();
    }
    
    return dependencies;
}


module.exports = { buildDependencies, bootstrapNotificationConsumers };