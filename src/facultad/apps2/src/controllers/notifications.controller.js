class NotificationsController {
    constructor (notificationsService) {
        this.notificationsService = notificationsService;
    }

    async getNotifications (req,res,next) {
        try {
            const query = req.query;
            const notifications = await this.notificationsService.getNotifications(query);

            res.status(notifications.status).json(notifications.data);
        } catch (error) {
            next(error);
        }
    }

    async getNotificationById (req,res,next) {
        try {
            const { uuid } = req.params;
            const notification = await this.notificationsService.getNotificationById(uuid);

            res.status(notification.status).json(notification.data);
        } catch (error) {
            next(error);
        }
    }

}

module.exports = {NotificationsController};