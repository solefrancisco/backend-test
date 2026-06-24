const { BadRequestError } = require('@notify/errors/bad-request.error');
const { renderAppointmentPendingConfirmationTemplate } = require('./appointment-pending-confirmation.template');
const { renderAppointmentConfirmedTemplate } = require('./appointment-confirmed.template');
const { renderAppointmentCancelledTemplate } = require('./appointment-cancelled.template');
const { renderAppointmentRescheduledTemplate } = require('./appointment-rescheduled.template');
const { renderAppointmentReminderTemplate } = require('./appointment-reminder.template');
const { renderAppointmentCheckedInTemplate } = require('./appointment-checked-in.template');
const { renderAppointmentFinishedTemplate } = require('./appointment-finished.template');
const { renderAppointmentExpiredTemplate } = require('./appointment-expired.template');
const { renderAppointmentAbsentTemplate } = require('./appointment-absent.template');

const templateMapper = {
    "appointment_pending_confirmation": renderAppointmentPendingConfirmationTemplate,
    "appointment_confirmed": renderAppointmentConfirmedTemplate,
    "appointment_cancelled": renderAppointmentCancelledTemplate,
    "appointment_rescheduled": renderAppointmentRescheduledTemplate,
    "appointment_reminder": renderAppointmentReminderTemplate,
    "appointment_checked_in": renderAppointmentCheckedInTemplate,
    "appointment_finished": renderAppointmentFinishedTemplate,
    "appointment_expired": renderAppointmentExpiredTemplate,
    "appointment_absent": renderAppointmentAbsentTemplate
};

function renderEmailTemplate(data) {
    const type = data.notification_type;
    const renderer = templateMapper[type];

    if (!renderer)
        throw new BadRequestError(`Invalid email notification type '${type}'`);

    return renderer(data);
}

module.exports = { renderEmailTemplate };