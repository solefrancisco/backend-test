const { NotificationsClient } = require('@apps2/integrations/notifications/notifications.client');
const { NotificationsAdapter } = require('@apps2/integrations/notifications/notifications.adapter');
const { NotificationsController } = require('@apps2/controllers/notifications.controller');
const { integrationConfig } = require('@apps2/configs/integration.config');

function buildNotificationsController() {
    return new NotificationsController(
        buildNotificationsClient()
    );
}

function buildNotificationsClient() {
    if (!integrationConfig.notificationsEnabled) {
        return {};
    }

    return new NotificationsClient(
        integrationConfig.notificationsBaseUrl,
        integrationConfig.notificationsApiKey,
        buildNotificationsAdapter()
    );
}

function buildNotificationsAdapter() {
    return new NotificationsAdapter();
}

module.exports = { buildNotificationsClient, buildNotificationsController };