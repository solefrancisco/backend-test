const { z } = require('zod');
const { appointmentEmailNotificationSchema } = require('./appointment-email-notification.schema');
const { webhookNotificationSchema } = require('./webhook-notification.schema');

const queueNotificationSchema = z.discriminatedUnion('notifyBy', [
  appointmentEmailNotificationSchema,
  webhookNotificationSchema,
]);

module.exports = { queueNotificationSchema };