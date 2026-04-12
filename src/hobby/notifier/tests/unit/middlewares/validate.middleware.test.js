const test = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');

const { validate } = require('@notify/middlewares/validate.middleware');

test('validate calls next and stores parsed data in validatedBody when body is valid', () => {
  const schema = z.object({ id: z.coerce.number().int().positive() });
  const middleware = validate(schema, 'body');

  const req = { body: { id: '5' } };
  const res = {
    status() {
      throw new Error('status should not be called');
    }
  };
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.validatedBody, { id: 5 });
});

test('validate returns 400 with details when validation fails', () => {
  const schema = z.object({ id: z.number().positive('id must be positive') });
  const middleware = validate(schema, 'body');

  const req = { body: { id: -1 } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: 'Validation error',
    details: [
      {
        field: 'id',
        message: 'id must be positive'
      }
    ]
  });
});

test('validate can read from params source', () => {
  const schema = z.object({ id: z.coerce.number().int().positive() });
  const middleware = validate(schema, 'params');

  const req = { params: { id: '10' } };
  const res = {
    status() {
      throw new Error('status should not be called');
    }
  };

  middleware(req, res, () => {});

  assert.deepEqual(req.validatedBody, { id: 10 });
});
