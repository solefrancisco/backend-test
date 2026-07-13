const test = require('node:test');
const assert = require('node:assert/strict');

const { createApiKeyMiddleware } = require('@apps2/middlewares/api-key.middleware');

function createResponseMock() {
  return {
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
}

test('api key middleware calls next when x-api-key matches', () => {
  const middleware = createApiKeyMiddleware('appointments-secret-key');
  const req = { headers: { 'x-api-key': 'appointments-secret-key' } };
  const res = createResponseMock();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('api key middleware returns 401 when x-api-key is missing or invalid', () => {
  const middleware = createApiKeyMiddleware('appointments-secret-key');

  for (const headers of [{}, { 'x-api-key': 'wrong-key' }]) {
    const req = { headers };
    const res = createResponseMock();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'invalid api key' });
  }
});
