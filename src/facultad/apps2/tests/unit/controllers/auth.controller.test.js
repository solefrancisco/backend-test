const test = require('node:test');
const assert = require('node:assert/strict');

const { AuthController } = require('@apps2/controllers/auth.controller');

function createResponse() {
    return {
        redirectedTo: null,
        cookies: {},
        statusCode: null,
        body: null,
        headers: {},
        redirect(target) {
            this.redirectedTo = target;
            return this;
        },
        cookie(name, value, options) {
            this.cookies[name] = { value, options };
            return this;
        },
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
        set(name, value) {
            this.headers[name] = value;
            return this;
        },
        send(body) {
            this.body = body;
            return this;
        },
        end() {
            return this;
        },
    };
}

test('ssoCallback redirects missing tickets to the frontend login', async () => {
    const controller = new AuthController({
        getLoginRedirect() {
            return 'https://turnos.solefrancisco.com/login';
        },
    });
    const res = createResponse();

    await controller.ssoCallback({
        headers: {},
        query: {},
        originalUrl: '/api/v1/auth/sso',
    }, res, assert.fail);

    assert.equal(res.redirectedTo, 'https://turnos.solefrancisco.com/login');
});

test('ssoCallback redirects failed exchanges to the frontend login', async () => {
    const controller = new AuthController({
        async exchangeSsoTicket() {
            return { success: false, status: 401 };
        },
        getLoginRedirect() {
            return 'https://turnos.solefrancisco.com/login';
        },
    });
    const res = createResponse();

    await controller.ssoCallback({
        headers: {},
        query: { ticket: 'valid-looking-ticket' },
        originalUrl: '/api/v1/auth/sso?ticket=valid-looking-ticket',
    }, res, assert.fail);

    assert.equal(res.redirectedTo, 'https://turnos.solefrancisco.com/login');
});

test('ssoCallback sets the session cookie and redirects successful exchanges to the frontend', async () => {
    const controller = new AuthController({
        async exchangeSsoTicket() {
            return { success: true, status: 200, data: { token: 'jwt-token' } };
        },
        getSafeRedirect(redirect) {
            assert.equal(redirect, '/agenda');
            return 'https://turnos.solefrancisco.com/agenda';
        },
        getLoginRedirect() {
            return 'https://turnos.solefrancisco.com/login';
        },
    });
    const res = createResponse();

    await controller.ssoCallback({
        headers: {},
        query: { ticket: 'valid-ticket', redirect: '/agenda' },
        originalUrl: '/api/v1/auth/sso?ticket=valid-ticket&redirect=/agenda',
    }, res, assert.fail);

    assert.equal(res.redirectedTo, 'https://turnos.solefrancisco.com/agenda');
    assert.equal(res.cookies.session.value, 'jwt-token');
    assert.equal(res.cookies.session.options.httpOnly, true);
});

test('ssoTicket forwards bearer token to Core', async () => {
    const controller = new AuthController({
        async createSsoTicket(token, requestId) {
            assert.equal(token, 'user-token');
            assert.equal(requestId, 'req-ticket');
            return {
                status: 200,
                contentType: 'application/json',
                body: '{"ticket":"sso-ticket"}',
            };
        },
    });
    const res = createResponse();

    await controller.ssoTicket({
        headers: {
            authorization: 'Bearer user-token',
            'x-request-id': 'req-ticket',
        },
    }, res, assert.fail);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Content-Type'], 'application/json');
    assert.equal(res.body, '{"ticket":"sso-ticket"}');
});

test('ssoTicket reads session cookie token', async () => {
    const controller = new AuthController({
        async createSsoTicket(token) {
            assert.equal(token, 'cookie-token');
            return {
                status: 200,
                contentType: 'application/json',
                body: '{"ticket":"sso-ticket"}',
            };
        },
    });
    const res = createResponse();

    await controller.ssoTicket({
        headers: {
            cookie: 'other=value; session=cookie-token',
        },
    }, res, assert.fail);

    assert.equal(res.statusCode, 200);
});

test('ssoTicket returns a readable error when token is missing', async () => {
    const controller = new AuthController({});
    const res = createResponse();

    await controller.ssoTicket({
        headers: {},
    }, res, assert.fail);

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'missing_auth_token');
    assert.match(res.body.message, /Authorization: Bearer/);
    assert.deepEqual(res.body.received, {
        authorization: 'missing',
        cookie: 'missing',
    });
});
