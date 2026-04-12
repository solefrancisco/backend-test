const { NotificationController } = require('@notify/controllers/notification.controller');
const { NotificationService } = require('@notify/services/notification.service');
const { startEmailConsumer } = require('@notify/integrations/messaging/consumers/email.consumer');
const { startWebhookConsumer } = require('@notify/integrations/messaging/consumers/webhook.consumer');


function buildNotificationController() {
    const notificationService = new NotificationService(buildNotificationRepository());
    return new NotificationController(notificationService);
}

function buildNotificationRepository() {
    return buildMySqlRepository();
}

function buildMySqlRepository() {
    const { dbPool } = require('@notify/configs/database.config');
    const { MySqlNotificationRepository } = require('@notify/repositories/notification.repository');
    return new MySqlNotificationRepository(dbPool);
}

async function bootstrapNotificationConsumers() {
    await startEmailConsumer();
    // await startWebhookConsumer();
}

module.exports = { buildNotificationController, bootstrapNotificationConsumers };