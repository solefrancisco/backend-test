const { publishToQueue } = require('@notify/integrations/messaging/rabbit.publisher');
const { hmacApiKey } = require('@notify/utils/hmac-api-key.util');
const { InternalServerError } = require('@notify/errors/internal-server.error');
const { BadRequestError } = require('@notify/errors/bad-request.error');

class NotificationService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    async queueNotification(apiKey, data) {
        const hashed = hmacApiKey(apiKey);
        const apiKeyValidation = await this.notificationRepository.validateApiKey(hashed);

        if (!apiKeyValidation.success) {
            throw new InternalServerError(`Database error during API key validation: ${apiKeyValidation.errorMessage}`);
        }

        if (!apiKeyValidation.data) {
            throw new BadRequestError('Invalid or inactive API key');
        }

        const queue = data.notify_by === 'email' ? 'notifications.email' : 'notifications.webhook';
        data.notification_sent_by = apiKeyValidation.data.owner;

        await publishToQueue(queue, data);

        return { message: 'Notification queued successfully' };
    }

}

module.exports = { NotificationService };