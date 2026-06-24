const { z } = require('zod');

const requiredHeadersSchema = z.object({
  'x-api-key': z
    .string({
      required_error: 'x-api-key header is required',
      invalid_type_error: 'x-api-key header must be a string',
    })
    .trim()
    .min(1, 'x-api-key header cannot be empty'),

    'x-request-id': z
    .string({
      required_error: 'x-request-id header is required',
      invalid_type_error: 'x-request-id header must be a string',
    })
    .trim()
    .min(1, 'x-request-id header cannot be empty'),
}).passthrough();

module.exports = { requiredHeadersSchema };