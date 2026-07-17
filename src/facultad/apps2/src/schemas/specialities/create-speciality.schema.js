const { z } = require('zod');

const createSpecialitySchema = z.object({
  speciality_id: z
    .number({
      invalid_type_error: 'speciality_id must be a number'
    })
    .int('speciality_id must be an integer')
    .positive('speciality_id must be a positive integer')
    .optional(),

  name: z
    .string({
      required_error: 'name is required',
      invalid_type_error: 'name must be a string'
    })
    .trim()
    .min(1, 'name is required'),

  is_high_complexity: z
    .number({
      required_error: 'is_high_complexity is required',
      invalid_type_error: 'is_high_complexity must be 0 or 1'
    })
    .int('is_high_complexity must be 0 or 1')
    .refine(value => value === 0 || value === 1, {
      message: 'is_high_complexity must be 0 or 1'
    }),

  type: z.enum(['CONSULTATION', 'SURGERY', 'STUDY'], {
    required_error: 'type is required',
    invalid_type_error: 'type must be CONSULTATION, SURGERY or STUDY'
  })
}).strict();

module.exports = { createSpecialitySchema };
