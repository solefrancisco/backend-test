class NotificationsController {
    constructor (notificationsClient) {
        this.notificationsClient = notificationsClient;
    }

    async getNotifications (req,res,next) {
        try {
            const query = req.query;
            const notifications = await this.notificationsClient.getNotifications(query, req.requestId);

            res.status(200).json(notifications);
        } catch (error) {
            next(error);
        }
    }

    async getNotification (req,res,next) {
        try {
            const { uuid } = req.params;
            const notification = await this.notificationsClient.getNotification(uuid, req.requestId);

            res.status(200).json(notification);
        } catch (error) {
            next(error);
        }
    }

}

module.exports = {NotificationsController};