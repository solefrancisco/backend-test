const { BadRequestError } = require('@notify/errors/bad-request.error');
const { renderAppointmentPendingConfirmationTemplate } = require('./appointment-pending-confirmation.template');
const { renderAppointmentConfirmedTemplate } = require('./appointment-confirmed.template');
const { renderAppointmentCancelledTemplate } = require('./appointment-cancelled.template');
const { renderAppointmentRescheduledTemplate } = require('./appointment-rescheduled.template');
const { renderAppointmentReminderTemplate } = require('./appointment-reminder.template');

function renderEmailTemplate(data) {
  const type = data.notification_type;

  if (type === 'appointment_pending_confirmation') {
    return renderAppointmentPendingConfirmationTemplate(data);
  }

  if (type === 'appointment_confirmed') {
    return renderAppointmentConfirmedTemplate(data);
  }

  if (type === 'appointment_cancelled') {
    return renderAppointmentCancelledTemplate(data);
  }

  if (type === 'appointment_rescheduled') {
    return renderAppointmentRescheduledTemplate(data);
  }

  if (type === 'appointment_reminder') {
    return renderAppointmentReminderTemplate(data);
  }

  throw new BadRequestError('Invalid email notification type');
}

module.exports = { renderEmailTemplate };