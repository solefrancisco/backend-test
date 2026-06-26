const crypto = require('crypto');

const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { NotFoundError } = require('@apps2/errors/not-found.error');
const { InternalServerError } = require('@apps2/errors/internal-server.error');

class NotificationsService {
    constructor (notificationsClient) {
        this.notificationsClient = notificationsClient;
    }

    async getNotificationById(notificationUuid) {
        const requestId = crypto.randomUUID();
        return await this.notificationsClient.getNotificationById(notificationUuid, requestId);;
    }

    async getNotifications(query) {
        const requestId = crypto.randomUUID();
        const notificationsData = await this.notificationsClient.getNotifications(query, requestId);

        const response = {
            data: notificationsData.data,
            status: notificationsData.status
        }

        if (notificationsData.status == 500)
            return response;

        if (notificationsData.status == 404)
            return response;

        if (notificationsData.status == 400)
            return response;

        const grouped = Object.values(
            notificationsData.data.notifications.reduce((acc, notification) => {
                const { uuid, notified_by, status } = notification;

                if (!acc[uuid]) {
                    acc[uuid] = {
                        notification_uuid: uuid,
                        notifications: []
                    };
                }

                acc[uuid].notifications.push({
                    notified_by,
                    status
                });

                return acc;
            }, {})
        );

        return {
            data: {
                notifications: grouped,
                pagination: notificationsData.data.pagination
            },
            status: notificationsData.status
        };
    }
}

module.exports = { NotificationsService };