const { z } = require('zod');

const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const getNotificationSchema = z
  .object({
    since: z
      .string({ required_error: 'since is required', invalid_type_error: 'since must be a string' })
      .regex(dateTimeRegex, 'since must be YYYY-MM-DD HH:mm:ss'),

    until: z
      .string({ required_error: 'until is required', invalid_type_error: 'until must be a string' })
      .regex(dateTimeRegex, 'until must be YYYY-MM-DD HH:mm:ss'),
    
    page: z
      .coerce.number({
        invalid_type_error: 'page must be a number'
      })
      .int('page must be an integer')
      .positive('page must be a positive integer')
      .default(1),
    
    sent_by: z
      .string()
      .trim()
      .optional(),
    
    notified_by: z
    .enum(['webhook', 'email'])
    .optional()
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
        message: 'difference cannot exceed 1 month',
        path: ['until'],
      });
    }
  });

module.exports = {getNotificationSchema};