const { z } = require('zod');

const webhookNotificationSchema = z.object({
  notify_by: z.literal('webhook'),
  request: z.object({
    url: z
      .string({
        required_error: 'request.url is required',
        invalid_type_error: 'request.url must be a string',
      })
      .url('request.url must be a valid URL'),

    method: z
      .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'], {
        invalid_type_error: 'request.method is invalid',
      })
      .default('POST')
      .optional(),

    headers: z
      .record(
        z.string({ invalid_type_error: 'header name must be a string' }),
        z.string({ invalid_type_error: 'header value must be a string' })
      )
      .optional(),

    body: z.any().optional(),
  }),
}).strict();

module.exports = { webhookNotificationSchema };