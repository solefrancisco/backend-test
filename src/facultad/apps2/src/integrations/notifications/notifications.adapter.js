const { InternalServerError } = require('@apps2/errors/internal-server.error');

const {
    generateCreateAppointmentNotification,
    generateRescheduleAppointmentNotification,
    generateCancelAppointmentNotification,
    generateConfirmAppointmentNotification,
    generateCheckInAppointmentNotification,
    generateFinishAppointmentNotification,
    generateExpiredAppointmentNotification,
    generateReminderAppointmentNotification,
    generateAbsentAppointmentNotification,
    generateOperationsRoomWebhookNotification,
    generateHighComplexityWebhookNotification,
    generateCheckInWebhookNotification
} = require('@apps2/integrations/notifications/appointments-notification.mapper');

class NotificationsAdapter {
  constructor() {
    this.mapping = {
      createAppointment: {
        template: 'appointment_pending_confirmation',
        generator: generateCreateAppointmentNotification,
      },
      confirmAppointment: {
        template: 'appointment_confirmed',
        generator: generateConfirmAppointmentNotification,
      },
      cancelAppointment: {
        template: 'appointment_cancelled',
        generator: generateCancelAppointmentNotification,
      },
      rescheduleAppointment: {
        template: 'appointment_rescheduled',
        generator: generateRescheduleAppointmentNotification,
      },
      remindAppointment: {
        template: 'appointment_reminder',
        generator: generateReminderAppointmentNotification,
      },
      checkInAppointment: {
        template: 'appointment_checked_in',
        generator: generateCheckInAppointmentNotification,
      },
      finishAppointment: {
        template: 'appointment_finished',
        generator: generateFinishAppointmentNotification,
      },
      expiredAppointment: {
        template: 'appointment_expired',
        generator: generateExpiredAppointmentNotification,
      },
      absentAppointment: {
        template: 'appointment_absent',
        generator: generateAbsentAppointmentNotification,
      },
      webhookOperationsRoom: {
        generator: generateOperationsRoomWebhookNotification,
      },
      webhookHighComplexity: {
        generator: generateHighComplexityWebhookNotification,
      },
      webhookCheckIn: {
        generator: generateCheckInWebhookNotification,
      }
    };
  }

  getTemplate(notificationType) {
    const notification = this.mapping[notificationType];

    if (!notification)
      throw new InternalServerError(`Notification type ${notificationType} is not supported.`);

    if (!notification.generator)
      throw new InternalServerError(`Notification generator for ${notificationType} is not implemented.`);

    return notification;
  }

  generateEmailNotification(data, appointmentId, notificationType) {
    const notification = this.getTemplate(notificationType);
    return notification.generator(data, appointmentId, notification.template);
  }

  generateWebhookNotification(data, appointmentId, webhookNotification, requestId) {
    const notificationType = webhookNotification.notification_type;
    const reason = webhookNotification.reason;
    const metadata = webhookNotification.metadata;

    const notification = this.getTemplate(notificationType);
    return notification.generator(data, appointmentId, notification.template, reason, metadata, requestId);
  }

}

module.exports = { NotificationsAdapter };