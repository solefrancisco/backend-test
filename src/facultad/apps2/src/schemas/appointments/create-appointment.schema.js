const { z } = require('zod');

const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const personSchema = (fieldName) => z.object({
  id: z
    .number({
      required_error: `${fieldName}.id is required`,
      invalid_type_error: `${fieldName}.id must be a number`
    })
    .int(`${fieldName}.id must be an integer`)
    .positive(`${fieldName}.id must be greater than 0`),

  fullname: z
    .string({
      required_error: `${fieldName}.fullname is required`,
      invalid_type_error: `${fieldName}.fullname must be a string`
    })
    .trim()
    .min(1, `${fieldName}.fullname is required`),

  email: z
    .string({
      required_error: `${fieldName}.email is required`,
      invalid_type_error: `${fieldName}.email must be a string`
    })
    .trim()
    .email(`${fieldName}.email must be a valid email`)
}).strict();

const createAppointmentSchema = z.object({
  medic: personSchema('medic'),

  patient: personSchema('patient'),

  appointment: z.object({
    starts_at: z
      .string({
        required_error: 'appointment.starts_at is required',
        invalid_type_error: 'appointment.starts_at must be a string'
      })
      .regex(dateTimeRegex, 'appointment.starts_at must be YYYY-MM-DD HH:mm:ss'),

    ends_at: z
      .string({
        required_error: 'appointment.ends_at is required',
        invalid_type_error: 'appointment.ends_at must be a string'
      })
      .regex(dateTimeRegex, 'appointment.ends_at must be YYYY-MM-DD HH:mm:ss'),

    speciality_id: z
      .number({
        required_error: 'appointment.speciality_id is required',
        invalid_type_error: 'appointment.speciality_id must be a number'
      })
      .int('appointment.speciality_id must be an integer')
      .positive('appointment.speciality_id must be greater than 0'),

    center_id: z
      .number({
        required_error: 'appointment.center_id is required',
        invalid_type_error: 'appointment.center_id must be a number'
      })
      .int('appointment.center_id must be an integer')
      .positive('appointment.center_id must be greater than 0')
  }).strict()
}).strict().superRefine((data, ctx) => {
  const { medic, patient, appointment } = data;

  const startsAt = new Date(appointment.starts_at.replace(' ', 'T') + '-03:00');
  const endsAt = new Date(appointment.ends_at.replace(' ', 'T') + '-03:00');

  if (startsAt >= endsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'appointment.starts_at must be before appointment.ends_at',
      path: ['appointment', 'starts_at'],
    });
  }

  const diffMs = endsAt - startsAt;
  const maxTimePerTurn = 30 * 60 * 1000;

  if (diffMs !== maxTimePerTurn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'the difference between appointment.starts_at and appointment.ends_at must be equal to 30 minutes',
      path: ['appointment', 'ends_at']
    });
  }

  if (medic.id === patient.id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'medic.id and patient.id cannot be the same',
      path: ['patient', 'id']
    });
  }
    /*
    const now = new Date();
    if (startsAt < now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'appointment.starts_at cannot be in the past',
        path: ['appointment', 'starts_at']
      });
    }

    const startsAtHour = parseInt(appointment.starts_at.split(' ')[1].split(':')[0]);
    // const endsAtHour = parseInt(appointment.ends_at.split(' ')[1].split(':')[0]);
    if (startsAtHour < 9 || startsAtHour > 17) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'appointment.starts_at must be between 09:00:00 and 17:30:00',
        path: ['appointment', 'starts_at']
      });
    }

    if (endsAtHour < 9 || endsAtHour > 18) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'appointment.ends_at must be between 09:30:00 and 18:00:00',
        path: ['appointment', 'ends_at']
      });
    }
     */
});

module.exports = { createAppointmentSchema };