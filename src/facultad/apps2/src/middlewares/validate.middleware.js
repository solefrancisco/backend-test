const { ZodIssueCode } = require('zod');

function validate(schema, source) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: result.error.issues.flatMap((issue) => {
          if (issue.code === ZodIssueCode.unrecognized_keys) {
            return issue.keys.map((key) => ({
              field: `${source}.${key}`,
              message: 'unknown parameter',
            }));
          }

          return [{
            field: issue.path.length
              ? `${source}.${issue.path.join('.')}`
              : source,
            message: issue.message,
          }];
        }),
      });
    }

    req.validatedRequest = {
      ...req.validatedRequest,
      [source]: result.data
    };
    next();
  };
}

module.exports = { validate };