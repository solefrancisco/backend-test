const { BadRequestError } = require('@notify/errors/bad-request.error');
const { NotFoundError } = require('@notify/errors/not-found.error');
const { InternalServerError } = require('@notify/errors/internal-server.error');
const { ConflictError } = require('@notify/errors/conflict.error');
const { paginationConfig } = require('@notify/configs/pagination.config');
const { publishToQueue } = require('@notify/integrations/messaging/rabbit.publisher');

class NotificationService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    async queueNotification(data) {
        const queue = data.notifyBy === 'email' ? 'notifications.email' : 'notifications.webhook';
        
        await publishToQueue(queue, data);

        return { message: 'Notification queued successfully' };
    }

    async getNotifications(query) {
        const quantity = await this.notificationRepository.count(query);
        if (!quantity.success)
            throw new InternalServerError('Failed to paginate notifications: ' + quantity.errorMessage);

        const totalItems = quantity.data;
        if (totalItems === 0)
            throw new NotFoundError('No notifications found for the given criteria');

        const totalPages = Math.ceil(totalItems / paginationConfig.defaultPageSize);
        if (query.page > totalPages)
            throw new BadRequestError(`Page ${query.page} does not exist. Total pages: ${totalPages}`);

        const result = await this.notificationRepository.findAll(paginationConfig.defaultPageSize, query);
        if (!result.success)
            throw new InternalServerError('Failed to retrieve notifications: ' + result.errorMessage);
        
        return {
            notifications: result.data,
            pagination: {
                totalItems: totalItems,
                totalPages: totalPages,
                itemsPerPage: paginationConfig.defaultPageSize
            }
        };
    }

    async getNotificationById(id) {
        const response = await this.notificationRepository.findById(id);
        
        if (!response.success)
            throw new InternalServerError('Failed to find notification: ' + response.errorMessage);

        if (!response.data)
            throw new NotFoundError(`Notification id ${id} not found`);
        
        return response.data;
    }

}

module.exports = { NotificationService };