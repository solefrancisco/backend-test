const { Router } = require('express');
const { validate } = require('@notify/middlewares/validate.middleware');
const { queueNotificationSchema } = require('@notify/schemas/queue-notification.schema');
const { apiKeyHeaderSchema } = require('@notify/schemas/api-key.schema');

function NotificationRouter(NotificationController) {
    const router = Router();

    router.post(
        '/',
        validate(apiKeyHeaderSchema, 'headers'),
        validate(queueNotificationSchema, 'body'),
        (req, res, next) => NotificationController.queueNotification(req, res, next)
    );

    return router;
}

module.exports = { NotificationRouter };