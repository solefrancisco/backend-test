const { Router } = require('express');
const { validate } = require('@notify/middlewares/validate.middleware');
const { queueNotificationSchema } = require('@notify/schemas/queue-notification.schema');
const { requiredHeadersSchema } = require('@notify/schemas/required-headers.schema');
const { getNotificationSchema } = require('@notify/schemas/get-notifications.schema');
const { getNotificationByUuidSchema } = require('@notify/schemas/get-notification-by-uuid.schema');

function NotificationRouter(NotificationController) {
    const router = Router();

    router.post(
        '/',
        validate(requiredHeadersSchema, 'headers'),
        validate(queueNotificationSchema, 'body'),
        (req, res, next) => NotificationController.queueNotification(req, res, next)
    );

    router.get(
        '/',
        validate(getNotificationSchema, 'query'),
        (req, res, next) => NotificationController.getNotifications(req, res, next)
    )

    router.get('/:uuid', 
        validate(getNotificationByUuidSchema, 'params'),
        (req, res, next) => NotificationController.getNotificationByUuid(req, res, next)
    );

    return router;
}

module.exports = { NotificationRouter };