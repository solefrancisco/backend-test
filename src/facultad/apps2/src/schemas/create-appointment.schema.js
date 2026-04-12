const { z } = require('zod');

const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const createAppointmentSchema = z.object({
  medic_id: z
    .number({ required_error: 'medic_id is required', invalid_type_error: 'medic_id must be a number' })
    .int('medic_id must be an integer')
    .positive('medic_id must be greater than 0'),

  patient_id: z
    .number({ required_error: 'patient_id is required', invalid_type_error: 'patient_id must be a number' })
    .int('patient_id must be an integer')
    .positive('patient_id must be greater than 0'),

  center_id: z
    .number({ required_error: 'center_id is required', invalid_type_error: 'center_id must be a number' })
    .int('center_id must be an integer')
    .positive('center_id must be greater than 0'),

  speciality_id: z
    .number({ required_error: 'speciality_id is required', invalid_type_error: 'speciality_id must be a number' })
    .int('speciality_id must be an integer')
    .positive('speciality_id must be greater than 0'),

  starts_at: z
    .string({ required_error: 'starts_at is required', invalid_type_error: 'starts_at must be a string' })
    .regex(dateTimeRegex, 'starts_at must be YYYY-MM-DD HH:mm:ss'),

  ends_at: z
    .string({ required_error: 'ends_at is required', invalid_type_error: 'ends_at must be a string' })
    .regex(dateTimeRegex, 'ends_at must be YYYY-MM-DD HH:mm:ss')
}).strict().superRefine((data, ctx) => {
  const startsAt = new Date(data.starts_at.replace(' ', 'T'));
  const endsAt = new Date(data.ends_at.replace(' ', 'T'));

  // regla 1: orden
  if (startsAt >= endsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'starts_at must be before ends_at',
      path: ['starts_at'],
    });
  }

  // regla 2: dentro del horario laboral (9 a 18)
  const startsAtHour = startsAt.getHours();
  const endsAtHour = endsAt.getHours();

  if (startsAtHour < 9 || startsAtHour > 17) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'starts_at must be between 09:00:00 and 17:30:00',
      path: ['starts_at']
    });
  }

  if (endsAtHour < 9 || endsAtHour > 18) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ends_at must be between 09:30:00 and 18:00:00',
      path: ['ends_at']
    });
  }

  // regla 3: máximo 30 minutos por turno
  const diffMs = endsAt - startsAt;
  const maxTimePerTurn = 30 * 60 * 1000;

  if (diffMs != maxTimePerTurn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'the difference between starts_at and ends_at must be equal to 30 minutes',
      path: ['ends_at']
    });
  }

  // regla 4: el médico no puede ser el mismo que el paciente
  if (data.medic_id === data.patient_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'medic_id and patient_id cannot be the same',
      path: ['patient_id']
    });
  }

  // regla 5: no se pueden crear turnos en el pasado
  const now = new Date();
  if (startsAt < now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'starts_at cannot be in the past',
      path: ['starts_at']
    });
  }
});

module.exports = { createAppointmentSchema };