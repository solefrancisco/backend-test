const { NotificationController } = require('@notify/controllers/notification.controller');
const { NotificationService } = require('@notify/services/notification.service');
const { startEmailConsumer } = require('@notify/integrations/messaging/consumers/email.consumer');
const { startWebhookConsumer } = require('@notify/integrations/messaging/consumers/webhook.consumer');
const { dbPool } = require('@notify/configs/database.config');


function buildNotificationController() {
    const notificationService = new NotificationService(buildNotificationRepository());
    return new NotificationController(notificationService);
}

function buildNotificationRepository() {
    return buildMySqlNotificationRepository();
}

function buildMySqlNotificationRepository() {
    const { MySqlNotificationRepository } = require('@notify/repositories/notification.repository');
    return new MySqlNotificationRepository(dbPool);
}

function buildMySqlNotificationConsumerRepository() {
    const { MySqlNotificationConsumerRepository } = require('@notify/repositories/consumer.repository');
    return new MySqlNotificationConsumerRepository(dbPool);
}

async function bootstrapNotificationConsumers() {
    const notificationConsumerRepository = buildMySqlNotificationConsumerRepository();

    await startEmailConsumer(notificationConsumerRepository);
    await startWebhookConsumer(notificationConsumerRepository);
}

module.exports = { buildNotificationController, bootstrapNotificationConsumers };