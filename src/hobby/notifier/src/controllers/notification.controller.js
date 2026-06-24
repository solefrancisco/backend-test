class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }

    async queueNotification(req, res, next) {
        try {
            const data = req.validatedRequest.body;
            const apiKey = req.validatedRequest.headers['x-api-key'];
            const requestId = req.validatedRequest.headers['x-request-id'];
            const notification = await this.notificationService.queueNotification(apiKey, requestId, data);

            res.status(202).json(notification);
        } catch (error) {
            next(error);
        }   
    }

    async getNotifications(req,res,next) {
        try{
            const query = req.validatedRequest.query;
            const notifications = await this.notificationService.getNotifications(query);

            res.status(200).json(notifications);
        } catch (error) {
            next (error);
        }
    }

    async getNotificationByUuid(req,res,next) {
        try{
            const uuid = req.validatedRequest.params.uuid;
            const notification = await this.notificationService.getNotificationByUuid(uuid);

            res.status(200).json(notification);
        } catch (error) {
            next (error);
        }
    }
}

module.exports = { NotificationController };