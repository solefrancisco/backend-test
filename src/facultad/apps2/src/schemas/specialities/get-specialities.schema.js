const { z } = require('zod');

const getSpecialitiesSchema = z.object({
  is_high_complexity: z
    .coerce.number({
      invalid_type_error: 'is_high_complexity must be 0 or 1'
    })
    .int('is_high_complexity must be 0 or 1')
    .refine(value => value === 0 || value === 1, {
      message: 'is_high_complexity must be 0 or 1'
    })
    .optional(),
    
  page: z
    .coerce.number({
      invalid_type_error: 'page must be a number'
    })
    .int('page must be an integer')
    .positive('page must be a positive integer')
    .default(1)
}).strict();

module.exports = { getSpecialitiesSchema };