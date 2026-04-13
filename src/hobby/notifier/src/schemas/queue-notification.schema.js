const { z } = require('zod');
const { appointmentEmailNotificationSchema } = require('./appointment-email-notification.schema');
const { webhookNotificationSchema } = require('./webhook-notification.schema');

const queueNotificationSchema = z.discriminatedUnion('notify_by', [
  appointmentEmailNotificationSchema,
  webhookNotificationSchema,
]);

module.exports = { queueNotificationSchema };