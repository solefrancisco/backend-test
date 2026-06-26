const { Router } = require('express');

const { validate } = require('@apps2/middlewares/validate.middleware');
const { createAppointmentSchema } = require('@apps2/schemas/appointments/create-appointment.schema');
const { getAppointmentsSchema } = require('@apps2/schemas/appointments/get-appointments.schema');
const { getAppointmentByIdSchema } = require('@apps2/schemas/appointments/get-appointment-by-id.schema');
const { confirmAppointmentByIdSchema } = require('@apps2/schemas/appointments/confirm-appointment-by-id.schema');
const { deleteAppointmentByIdSchema } = require('@apps2/schemas/appointments/delete-appointment-by-id.schema');
const { checkInAppointmentByIdSchema } = require('@apps2/schemas/appointments/check-in-appointment-by-id.schema');
const { finishAppointmentByIdSchema } = require('@apps2/schemas/appointments/finish-appointment-by-id.schema');
const { startAppointmentByIdSchema } = require('@apps2/schemas/appointments/start-appointment-by-id.schema');
const { rescheduleAppointmentByIdParamsSchema, rescheduleAppointmentByIdBodySchema} = require('@apps2/schemas/appointments/reschedule-appointment-by-id.schema');
const { getAppointmentNotificationsByIdSchema } = require('@apps2/schemas/appointments/get-appointment-notifications-by-id.schema');

function AppointmentsRouter(appointmentsController) {
    const router = Router();

    router.post(
        '/',
        validate(createAppointmentSchema, 'body'),
        (req, res, next) => appointmentsController.createAppointment(req, res, next)
    );

    router.get('/', 
        validate(getAppointmentsSchema, 'query'),
        (req, res, next) => appointmentsController.getAppointments(req, res, next)
    );

    router.get('/:id', 
        validate(getAppointmentByIdSchema, 'params'),
        (req, res, next) => appointmentsController.getAppointmentById(req, res, next)
    );

    router.patch('/:id/confirm', 
        validate(confirmAppointmentByIdSchema, 'params'),
        (req, res, next) => appointmentsController.confirmAppointmentById(req, res, next)
    );

    router.delete('/:id', 
        validate(deleteAppointmentByIdSchema, 'params'),
        (req, res, next) => appointmentsController.deleteAppointmentById(req, res, next)
    );

    router.patch('/:id/check-in', 
        validate(checkInAppointmentByIdSchema, 'params'),
        (req, res, next) => appointmentsController.checkInAppointmentById(req, res, next)
    );

    router.patch('/:id/reschedule',
        validate (rescheduleAppointmentByIdParamsSchema, 'params'),
        validate (rescheduleAppointmentByIdBodySchema, 'body'),
        (req, res, next) => appointmentsController.rescheduleAppointmentById(req, res, next) 
    );

    router.patch('/:id/start', 
        validate(startAppointmentByIdSchema, 'params'),
        (req, res, next) => appointmentsController.startAppointmentById(req, res, next)
    );

    router.patch('/:id/finish', 
        validate(finishAppointmentByIdSchema, 'params'),
        (req, res, next) => appointmentsController.finishAppointmentById(req, res, next)
    );

    router.get('/:id/notifications',
        validate(getAppointmentNotificationsByIdSchema, 'params'),
        (req,res,next) => appointmentsController.getAppointmentNotificationsById(req,res,next)
    );

    return router;
}

module.exports = { AppointmentsRouter };