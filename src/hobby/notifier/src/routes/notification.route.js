const { Router } = require('express');
const { validate } = require('@notify/middlewares/validate.middleware');
const { queueNotificationSchema } = require('@notify/schemas/queue-notification.schema');
const { getAppointmentsSchema } = require('@notify/schemas/get-appointments.schema');
const { getAppointmentByIdSchema } = require('@notify/schemas/get-appointment-by-id.schema');

function NotificationRouter(NotificationController) {
    const router = Router();

    router.post(
        '/',
        validate(queueNotificationSchema, 'body'),
        (req, res, next) => NotificationController.queueNotification(req, res, next)
    );

    router.get('/', 
        validate(getAppointmentsSchema, 'query'),
        (req, res, next) => NotificationController.getAppointments(req, res, next)
    );

    router.get('/:id', 
        validate(getAppointmentByIdSchema, 'params'),
        (req, res, next) => NotificationController.getAppointmentById(req, res, next)
    );

    return router;
}

module.exports = { NotificationRouter };