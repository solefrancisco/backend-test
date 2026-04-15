const { z } = require('zod');

const apiKeyHeaderSchema = z.object({
  'x-api-key': z
    .string({
      required_error: 'x-api-key header is required',
      invalid_type_error: 'x-api-key header must be a string',
    })
    .trim()
    .min(1, 'x-api-key header cannot be empty'),
});

module.exports = { apiKeyHeaderSchema };