const { z } = require('zod');

const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const appointmentsNotificationTypes = [ 
  'appointment_pending_confirmation', 
  'appointment_confirmed', 
  'appointment_cancelled', 
  'appointment_rescheduled', 
  'appointment_reminder',
  'appointment_checked_in',
  'appointment_finished',
  'appointment_expired',
  'appointment_absent'
]; 
const appointmentNotificationTypeEnum = z.enum(
  appointmentsNotificationTypes, { 
    required_error: 'notification_type is required', 
    invalid_type_error: 'notification_type is invalid' 
  }
);

const userSchema = (fieldName) => z.object({
    fullname: z
        .string({
            required_error: `${fieldName}.fullname is required`,
            invalid_type_error: `${fieldName}.fullname must be a string`,
        })
        .trim()
        .min(1, `${fieldName}.fullname is required`),

    email: z
        .string({
            required_error: `${fieldName}.email is required`,
            invalid_type_error: `${fieldName}.email must be a string`,
        })
        .email(`${fieldName}.email must be a valid email`)
}).strict();

const appointmentSchema = z.object({
    id: z
        .number({
            required_error: 'appointment.id is required',
            invalid_type_error: 'appointment.id must be a number',
        })
        .int('appointment.id must be an integer')
        .positive('appointment.id must be greater than 0'),

    starts_at: z
        .string({
            required_error: 'appointment.starts_at is required',
            invalid_type_error: 'appointment.starts_at must be a string',
        })
        .regex(dateTimeRegex, 'appointment.starts_at must be YYYY-MM-DD HH:mm:ss'),

    original_starts_at: z
        .string({
            invalid_type_error: 'appointment.original_starts_at must be a string',
        })
        .regex(dateTimeRegex, 'appointment.original_starts_at must be YYYY-MM-DD HH:mm:ss')
        .optional(),

    cancelled_at: z
        .string({
            invalid_type_error: 'appointment.cancelled_at must be a string',
        })
        .regex(dateTimeRegex, 'appointment.cancelled_at must be YYYY-MM-DD HH:mm:ss')
        .optional(),

    confirmed_at: z
        .string({
            invalid_type_error: 'appointment.confirmed_at must be a string',
        })
        .regex(dateTimeRegex, 'appointment.confirmed_at must be YYYY-MM-DD HH:mm:ss')
        .optional(),

    checked_in_at: z
        .string({
            invalid_type_error: 'appointment.checked_in_at must be a string',
        })
        .regex(dateTimeRegex, 'appointment.checked_in_at must be YYYY-MM-DD HH:mm:ss')
        .optional(),

    finished_at: z
        .string({
            invalid_type_error: 'appointment.finished_at must be a string',
        })
        .regex(dateTimeRegex, 'appointment.finished_at must be YYYY-MM-DD HH:mm:ss')
        .optional(),

    expired_at: z
        .string({
            invalid_type_error: 'appointment.expired_at must be a string',
        })
        .regex(dateTimeRegex, 'appointment.expired_at must be YYYY-MM-DD HH:mm:ss')
        .optional(),

    speciality_name: z
        .string({
            required_error: 'appointment.speciality_name is required',
            invalid_type_error: 'appointment.speciality_name must be a string',
        })
        .trim()
        .min(1, 'appointment.speciality_name is required'),

    medical_center_name: z
        .string({
            required_error: 'appointment.medical_center_name is required',
            invalid_type_error: 'appointment.medical_center_name must be a string',
        })
        .trim()
        .min(1, 'appointment.medical_center_name is required'),
    })
    .strict()

const appointmentEmailNotificationBaseSchema = z.object({
    notify_by: z.literal('email'),
    notification_type: appointmentNotificationTypeEnum,
    appointment: appointmentSchema,
    patient: userSchema('patient'),
    medic: userSchema('medic')
})
.strict()

const mapper = {
    appointment_rescheduled: 'original_starts_at',
    appointment_cancelled: 'cancelled_at',
    appointment_confirmed: 'confirmed_at',
    appointment_checked_in: 'checked_in_at',
    appointment_finished: 'finished_at',
    appointment_expired: 'expired_at',
};

const checkField = (notification, ctx) => {
    const expectedField = mapper[notification.notification_type];

    Object.entries(mapper).forEach(([notificationType, fieldName]) => {
        const hasField = !!notification.appointment[fieldName];

        if (notification.notification_type === notificationType && !hasField) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['appointment', fieldName],
                message: `appointment.${fieldName} is required when notification_type is ${notificationType}`,
            });
        }

        if (notification.notification_type !== notificationType && hasField) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['appointment', fieldName],
                message: `appointment.${fieldName} is only allowed when notification_type is ${notificationType}`,
            });
        }
    });
};

const appointmentEmailNotificationSchema =
    appointmentEmailNotificationBaseSchema.superRefine((data, ctx) => {
        checkField(data, ctx);
    }
);

module.exports = { appointmentEmailNotificationSchema };