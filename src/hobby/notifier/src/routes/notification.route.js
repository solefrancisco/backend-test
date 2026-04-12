const { Router } = require('express');
const { validate } = require('@notify/middlewares/validate.middleware');
const { queueNotificationSchema } = require('@notify/schemas/queue-notification.schema');

function NotificationRouter(NotificationController) {
    const router = Router();

    router.post(
        '/',
        validate(queueNotificationSchema, 'body'),
        (req, res, next) => NotificationController.queueNotification(req, res, next)
    );

    return router;
}

module.exports = { NotificationRouter };