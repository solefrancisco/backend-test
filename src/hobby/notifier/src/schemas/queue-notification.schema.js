const { z } = require('zod');

const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const notificationTypes = [
  'appointment_pending_confirmation',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_rescheduled',
  'appointment_reminder',
];

const queueNotificationSchema = z.object({
  notifyBy: z
    .enum(['email', 'webhook'], {
      required_error: 'notifyBy is required',
      invalid_type_error: 'notifyBy must be either "email" or "webhook"',
    }),

  notificationType: z
    .enum(notificationTypes, {
      required_error: 'notificationType is required',
      invalid_type_error: 'notificationType is invalid',
    }),

  appointmentId: z
    .number({
      required_error: 'appointmentId is required',
      invalid_type_error: 'appointmentId must be a number',
    })
    .int('appointmentId must be an integer')
    .positive('appointmentId must be greater than 0'),

  patientName: z
    .string({
      required_error: 'patientName is required',
      invalid_type_error: 'patientName must be a string',
    })
    .trim()
    .min(1, 'patientName is required'),

  medicName: z
    .string({
      required_error: 'medicName is required',
      invalid_type_error: 'medicName must be a string',
    })
    .trim()
    .min(1, 'medicName is required'),

  speciality: z
    .string({
      required_error: 'speciality is required',
      invalid_type_error: 'speciality must be a string',
    })
    .trim()
    .min(1, 'speciality is required'),

  startsAt: z
    .string({
      required_error: 'startsAt is required',
      invalid_type_error: 'startsAt must be a string',
    })
    .regex(dateTimeRegex, 'startsAt must be YYYY-MM-DD HH:mm:ss'),

  location: z
    .string({
      required_error: 'location is required',
      invalid_type_error: 'location must be a string',
    })
    .trim()
    .min(1, 'location is required'),

  to: z
    .string({ invalid_type_error: 'to must be a string' })
    .email('to must be a valid email')
    .optional(),

  url: z
    .string({ invalid_type_error: 'url must be a string' })
    .url('url must be a valid URL')
    .optional(),

  apiKey: z
    .string({ invalid_type_error: 'apiKey must be a string' })
    .trim()
    .min(1, 'apiKey cannot be empty')
    .optional(),
}).strict().superRefine((data, ctx) => {
  if (data.notifyBy === 'email' && !data.to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'to is required when notifyBy is email',
      path: ['to'],
    });
  }

  if (data.notifyBy === 'webhook' && !data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'url is required when notifyBy is webhook',
      path: ['url'],
    });
  }

  if (data.notifyBy === 'email' && data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'url is not allowed when notifyBy is email',
      path: ['url'],
    });
  }

  if (data.notifyBy === 'webhook' && data.to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'to is not allowed when notifyBy is webhook',
      path: ['to'],
    });
  }

  const startsAt = new Date(data.startsAt.replace(' ', 'T'));
  const now = new Date();

  if (
    data.notificationType === 'appointment_reminder' &&
    startsAt < now
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'startsAt cannot be in the past for appointment_reminder',
      path: ['startsAt'],
    });
  }
});

module.exports = { queueNotificationSchema };