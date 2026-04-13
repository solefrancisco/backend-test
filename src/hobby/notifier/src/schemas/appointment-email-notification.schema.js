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
  required_error: 'notification_type is required',
  invalid_type_error: 'notification_type is invalid',
});

const appointmentEmailNotificationSchema = z
  .object({
    notify_by: z.literal('email'),

    notification_type: appointmentNotificationTypeEnum,

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

    appointment_id: z
      .number({
        required_error: 'appointment_id is required',
        invalid_type_error: 'appointment_id must be a number',
      })
      .int('appointment_id must be an integer')
      .positive('appointment_id must be greater than 0'),

    patient_name: z
      .string({
        required_error: 'patient_name is required',
        invalid_type_error: 'patient_name must be a string',
      })
      .trim()
      .min(1, 'patient_name is required'),

    medic_name: z
      .string({ invalid_type_error: 'medic_name must be a string' })
      .trim()
      .min(1, 'medic_name cannot be empty')
      .optional(),

    speciality: z
      .string({ invalid_type_error: 'speciality must be a string' })
      .trim()
      .min(1, 'speciality cannot be empty')
      .optional(),

    starts_at: z
      .string({
        required_error: 'starts_at is required',
        invalid_type_error: 'starts_at must be a string',
      })
      .regex(dateTimeRegex, 'starts_at must be YYYY-MM-DD HH:mm:ss'),

    location: z
      .string({ invalid_type_error: 'location must be a string' })
      .trim()
      .min(1, 'location cannot be empty')
      .optional(),
  })
  .strict();

module.exports = { appointmentEmailNotificationSchema };