const { z } = require('zod');
const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const getAppointmentsSchema = z.object({
  since: z
    .string({ required_error: 'since is required', invalid_type_error: 'since must be a string' })
    .regex(dateTimeRegex, 'since must be YYYY-MM-DD HH:mm:ss'),

  until: z
    .string({ required_error: 'until is required', invalid_type_error: 'until must be a string' })
    .regex(dateTimeRegex, 'until must be YYYY-MM-DD HH:mm:ss'),

  patient_id: z
    .coerce.number({ 
      invalid_type_error: 'patient_id must be a number' 
    })
    .int('patient_id must be an integer')
    .positive('patient_id must be greater than 0')
    .optional(),

  medic_id: z
    .coerce.number({ 
      invalid_type_error: 'medic_id must be a number' 
    })
    .int('medic_id must be an integer')
    .positive('medic_id must be greater than 0')
    .optional(),

  medical_center_id: z
    .coerce.number({ 
      invalid_type_error: 'medical_center_id must be a number' 
    })
    .int('medical_center_id must be an integer')
    .positive('medical_center_id must be greater than 0')
    .optional(),
  
  speciality_id: z
    .coerce.number({ 
      invalid_type_error: 'speciality_id must be a number' 
    })
    .int('speciality_id must be an integer')
    .positive('speciality_id must be greater than 0')
    .optional(),

  page: z
    .coerce.number({
      invalid_type_error: 'page must be a number'
    })
    .int('page must be an integer')
    .positive('page must be a positive integer')
    .default(1)
}).strict().superRefine((data, ctx) => {
  const since = new Date(data.since.replace(' ', 'T')); 
  const until = new Date(data.until.replace(' ', 'T'));

  // regla 1: orden
  if (since >= until) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'since must be before until',
      path: ['since'],
    });
  }
  
  // regla 2: máximo 1 mes (31 días)  
  const maxDate = new Date(since);
  maxDate.setMonth(maxDate.getMonth() + 1);

  if (until > maxDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'the difference between since and until must not be greater than 1 month',
      path: ['until'],
    });
  }

  // regla 3: el médico no puede consultar sus turnos como paciente estando como médico y viceversa
  if (data.medic_id && data.patient_id && data.medic_id === data.patient_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'medic_id and patient_id cannot be the same',
      path: ['patient_id'],
    });
  }
});

module.exports = { getAppointmentsSchema };