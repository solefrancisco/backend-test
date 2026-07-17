const { ZodIssueCode } = require('zod');

function getRequestId(req) {
  return req.headers?.['x-request-id'] || req.headers?.['x-correlation-id'] || 'no-request-id';
}

function summarizeInput(input) {
  if (input == null) {
    return input;
  }

  if (Array.isArray(input)) {
    return { type: 'array', length: input.length };
  }

  if (typeof input === 'object') {
    return {
      type: 'object',
      keys: Object.keys(input).slice(0, 20),
    };
  }

  return {
    type: typeof input,
    value: String(input).slice(0, 120),
  };
}

function formatIssues(error, source) {
  return error.issues.flatMap((issue) => {
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
  });
}

function validate(schema, source) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = formatIssues(result.error, source);
      console.warn(`${getRequestId(req)} - [VALIDATION] Rejected ${req.method || 'UNKNOWN'} ${req.originalUrl || req.url || 'unknown route'} source=${source} details=${JSON.stringify(details)} input=${JSON.stringify(summarizeInput(req[source]))}`);

      return res.status(400).json({
        error: 'Validation error',
        details,
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
