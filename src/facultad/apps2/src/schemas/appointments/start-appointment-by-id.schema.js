const { z } = require('zod');

const startAppointmentByIdSchema = z.object({
  id: z.coerce
    .number({
      required_error: 'id is required',
      invalid_type_error: 'id must be a number'
    })
    .int('id must be an integer')
    .positive('id must be a positive integer')
});

module.exports = { startAppointmentByIdSchema };