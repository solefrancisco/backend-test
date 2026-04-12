const { z } = require('zod');

const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const appointmentsNotificationTypes = [
  'appointment_pending_confirmation',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_rescheduled',
  'appointment_reminder',
];

const appointmentNotificationTypeEnum = z.enum(appointmentsNotificationTypes, {
  required_error: 'notificationType is required',
  invalid_type_error: 'notificationType is invalid',
});

const appointmentEmailNotificationSchema = z
  .object({
    notifyBy: z.literal('email'),

    notificationType: appointmentNotificationTypeEnum,

    to: z
      .string({
        required_error: 'to is required',
        invalid_type_error: 'to must be a string',
      })
      .email('to must be a valid email')
      .refine((email) => {
        const domain = email.toLowerCase().split('@')[1] || '';

        // bloquea TLD .edu y también subdominios tipo universidad.edu.ar
        return !domain.includes('.edu');
      }, 'educational .edu domain is not allowed'),

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
      .string({ invalid_type_error: 'medicName must be a string' })
      .trim()
      .min(1, 'medicName cannot be empty')
      .optional(),

    speciality: z
      .string({ invalid_type_error: 'speciality must be a string' })
      .trim()
      .min(1, 'speciality cannot be empty')
      .optional(),

    startsAt: z
      .string({
        required_error: 'startsAt is required',
        invalid_type_error: 'startsAt must be a string',
      })
      .regex(dateTimeRegex, 'startsAt must be YYYY-MM-DD HH:mm:ss'),

    location: z
      .string({ invalid_type_error: 'location must be a string' })
      .trim()
      .min(1, 'location cannot be empty')
      .optional(),
  })
  .strict();

module.exports = { appointmentEmailNotificationSchema };