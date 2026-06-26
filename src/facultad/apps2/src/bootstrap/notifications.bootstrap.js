const { NotificationsClient } = require('@apps2/integrations/notifications/notifications.client');
const { NotificationsAdapter } = require('@apps2/integrations/notifications/notifications.adapter');
const { NotificationsController } = require('@apps2/controllers/notifications.controller');
const { NotificationsService } = require('@apps2/services/notifications.service');
const { integrationConfig } = require('@apps2/configs/integration.config');

function buildSpecialitiesController() {
    const specialitiesService = new SpecialitiesService(buildSpecialitiesRepository());
    return new SpecialitiesController(specialitiesService);
}

function buildNotificationsController() {
    const notificationsService = new NotificationsService(buildNotificationsClient());
    return new NotificationsController(notificationsService);
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