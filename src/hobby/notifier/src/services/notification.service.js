const { publishToQueue } = require('@notify/integrations/messaging/rabbit.publisher');

class NotificationService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    async queueNotification(data) {
        const queue = data.notify_by === 'email' ? 'notifications.email' : 'notifications.webhook';
        
        await publishToQueue(queue, data);

        return { message: 'Notification queued successfully' };
    }

}

module.exports = { NotificationService };