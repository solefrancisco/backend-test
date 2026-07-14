const { z } = require('zod');

const getMedicsSchema = z.object({
    speciality_id: z
        .coerce.number({
            invalid_type_error: 'speciality_id must be a number'
        })
        .int('speciality_id must be an integer')
        .positive('speciality_id must be a positive integer')
        .optional(),
}).strict();

module.exports = { getMedicsSchema };
