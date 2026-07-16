const { z } = require('zod');

const createMedicSchema = z.object({
    medic_id: z
        .number({
            required_error: 'medic_id is required',
            invalid_type_error: 'medic_id must be a number'
        })
        .int('medic_id must be an integer')
        .positive('medic_id must be a positive integer'),
    speciality_id: z
        .number({
            required_error: 'speciality_id is required',
            invalid_type_error: 'speciality_id must be a number'
        })
        .int('speciality_id must be an integer')
        .positive('speciality_id must be a positive integer'),
}).strict();

module.exports = { createMedicSchema };
