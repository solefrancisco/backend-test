class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }

    async queueNotification(req, res, next) {
        try {
            const data = req.body;
            const notification = await this.notificationService.queueNotification(data);

            res.status(200).json(notification);
        } catch (error) {
            next(error);
        }   
    }

    async getNotifications(req, res, next) {
        try {
            const query = req.query;
            const notifications = await this.notificationService.getNotifications(query);
            
            res.status(200).json(notifications);
        } catch (error) {
            next(error);
        }
    }

    async getNotificationById(req, res, next) {
        try {
            const { id } = req.params;
            const notification = await this.notificationService.getNotificationById(id);
            
            return res.status(200).json(notification);
        } catch (error) {
            next(error);
        }
    }

}

module.exports = { NotificationController };