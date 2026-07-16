const test = require('node:test');
const assert = require('node:assert/strict');

const { CoreClient } = require('@apps2/integrations/core/core.client');

test('readJson returns raw body when Core response is not valid JSON', async () => {
    const client = new CoreClient({});
    const response = {
        status: 502,
        async text() {
            return '502 Bad Gateway';
        },
    };

    const data = await client.readJson(response);

    assert.deepEqual(data, { raw: '502 Bad Gateway' });
});

test('getAccessToken shares one Core login across concurrent calls', async () => {
    const client = new CoreClient({
        email: 'doctor@example.com',
        password: 'secret',
    });
    let loginRequests = 0;

    client.fetchCore = async () => {
        loginRequests += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));

        return {
            ok: true,
            status: 200,
            async text() {
                return JSON.stringify({ token: 'core-token' });
            },
        };
    };

    const tokens = await Promise.all([
        client.getAccessToken(),
        client.getAccessToken(),
        client.getAccessToken(),
    ]);

    assert.deepEqual(tokens, ['core-token', 'core-token', 'core-token']);
    assert.equal(loginRequests, 1);
});

test('getUserById logs operation as getUserById', async () => {
    const client = new CoreClient({
        baseUrl: 'https://gw.healthcare.cantero.ar/api/core',
        email: 'doctor@example.com',
        password: 'secret',
    });
    client.accessToken = 'core-token';
    client.accessTokenExpiresAt = Date.now() + 1000;
    let capturedRequest;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            ok: true,
            status: 200,
            async text() {
                return JSON.stringify({ id: 85, email: 'medic@example.com' });
            },
        };
    };

    await client.getUserById(85, 'req-user');

    assert.equal(capturedRequest.method, 'GET');
    assert.equal(capturedRequest.url, 'https://gw.healthcare.cantero.ar/api/core/users/85');
    assert.equal(capturedRequest.context.operation, 'getUserById');
    assert.equal(capturedRequest.context.requestId, 'req-user');
});

test('login forwards credentials and returns Core response unchanged', async () => {
    const client = new CoreClient({});
    let capturedRequest;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            status: 201,
            headers: {
                get(name) {
                    return name === 'content-type' ? 'application/json; charset=utf-8' : null;
                },
            },
            async text() {
                return '{"token":"core-token","user":{"id":7}}';
            },
        };
    };

    const credentials = { email: 'doctor@example.com', password: 'secret' };
    const response = await client.login(credentials, 'req-123');

    assert.equal(capturedRequest.method, 'POST');
    assert.equal(capturedRequest.url, 'https://gw.healthcare.cantero.ar/api/auth/login');
    assert.equal(capturedRequest.options.body, JSON.stringify(credentials));
    assert.equal(capturedRequest.options.headers['x-request-id'], 'req-123');
    assert.equal(capturedRequest.context.operation, 'loginPassthrough');
    assert.deepEqual(response, {
        status: 201,
        contentType: 'application/json; charset=utf-8',
        body: '{"token":"core-token","user":{"id":7}}',
    });
});

test('forgotPassword forwards email and returns Core response unchanged', async () => {
    const client = new CoreClient({});
    let capturedRequest;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            status: 202,
            headers: {
                get(name) {
                    return name === 'content-type' ? 'application/json' : null;
                },
            },
            async text() {
                return '{"message":"reset email queued"}';
            },
        };
    };

    const payload = { email: 'patient@example.com' };
    const response = await client.forgotPassword(payload, 'req-forgot');

    assert.equal(capturedRequest.method, 'POST');
    assert.equal(capturedRequest.url, 'https://gw.healthcare.cantero.ar/api/auth/forgot-password');
    assert.equal(capturedRequest.options.body, JSON.stringify(payload));
    assert.equal(capturedRequest.options.headers['x-request-id'], 'req-forgot');
    assert.equal(capturedRequest.context.operation, 'forgotPasswordPassthrough');
    assert.deepEqual(response, {
        status: 202,
        contentType: 'application/json',
        body: '{"message":"reset email queued"}',
    });
});

test('resetPassword forwards payload and returns Core response unchanged', async () => {
    const client = new CoreClient({});
    let capturedRequest;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            status: 200,
            headers: {
                get(name) {
                    return name === 'content-type' ? 'application/json' : null;
                },
            },
            async text() {
                return '{"message":"password reset"}';
            },
        };
    };

    const payload = {
        code: '123456',
        email: 'patient@example.com',
        new_password: 'new-secret',
    };
    const response = await client.resetPassword(payload, 'req-reset');

    assert.equal(capturedRequest.method, 'POST');
    assert.equal(capturedRequest.url, 'https://gw.healthcare.cantero.ar/api/auth/reset-password');
    assert.equal(capturedRequest.options.body, JSON.stringify(payload));
    assert.equal(capturedRequest.options.headers['x-request-id'], 'req-reset');
    assert.equal(capturedRequest.context.operation, 'resetPasswordPassthrough');
    assert.deepEqual(response, {
        status: 200,
        contentType: 'application/json',
        body: '{"message":"password reset"}',
    });
});

test('register forwards payload and returns Core response unchanged', async () => {
    const client = new CoreClient({});
    let capturedRequest;
    let assignedRoleFromRegister;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            status: 200,
            headers: {
                get(name) {
                    return name === 'content-type' ? 'application/json' : null;
                },
            },
            async text() {
                return '{"id":10,"email":"patient@example.com"}';
            },
        };
    };
    client.assignRegisteredUserPatientRole = async (result, requestId) => {
        assignedRoleFromRegister = { result, requestId };
    };

    const payload = {
        email: 'patient@example.com',
        first_name: 'Patient',
        last_name: 'Example',
        password: 'secret',
    };
    const response = await client.register(payload, 'req-456');

    assert.equal(capturedRequest.method, 'POST');
    assert.equal(capturedRequest.url, 'https://gw.healthcare.cantero.ar/api/auth/register');
    assert.equal(capturedRequest.options.body, JSON.stringify(payload));
    assert.equal(capturedRequest.options.headers['x-request-id'], 'req-456');
    assert.equal(capturedRequest.context.operation, 'registerPassthrough');
    assert.deepEqual(response, {
        status: 200,
        contentType: 'application/json',
        body: '{"id":10,"email":"patient@example.com"}',
    });
    assert.deepEqual(assignedRoleFromRegister, {
        result: response,
        requestId: 'req-456',
    });
});

test('register response log includes registered user id', async () => {
    const client = new CoreClient({});
    const originalFetch = global.fetch;
    const originalLog = console.log;
    const logs = [];

    global.fetch = async () => new Response(
        '{"user":{"id":321},"email":"patient@example.com"}',
        {
            status: 201,
            headers: { 'content-type': 'application/json' },
        }
    );
    console.log = (message) => logs.push(message);
    client.assignRegisteredUserPatientRole = async () => {};

    try {
        await client.register({
            email: 'patient@example.com',
            first_name: 'Patient',
            last_name: 'Example',
            password: 'secret',
        }, 'req-register');
    } finally {
        global.fetch = originalFetch;
        console.log = originalLog;
    }

    assert.ok(logs.some((message) =>
        message.includes('[CORE] <- POST https://gw.healthcare.cantero.ar/api/auth/register') &&
        message.includes('status=201') &&
        message.includes('operation=registerPassthrough') &&
        message.includes('registeredUserId=321')
    ));
});

test('getRegisteredUserId reads top-level id or nested user id from register body', () => {
    const client = new CoreClient({});

    assert.equal(client.getRegisteredUserId('{"id":10}'), 10);
    assert.equal(client.getRegisteredUserId('{"user":{"id":219}}'), 219);
});

test('assignRegisteredUserPatientRole posts default role for registered user id', async () => {
    const client = new CoreClient({
        email: 'service@example.com',
        password: 'secret',
    });
    const capturedRequests = [];

    client.fetchCore = async (method, url, options, context) => {
        capturedRequests.push({ method, url, options, context });

        if (context.operation === 'getAccessToken') {
            return {
                ok: true,
                status: 200,
                async text() {
                    return '{"token":"service-token"}';
                },
            };
        }

        return {
            ok: true,
            status: 200,
            async text() {
                return '{"ok":true}';
            },
        };
    };

    await client.assignRegisteredUserPatientRole({
        status: 201,
        body: '{"user":{"id":219},"token":"registered-user-token"}',
    }, 'req-789');

    const roleRequest = capturedRequests.find(request => request.context.operation === 'assignUserRole');

    assert.equal(roleRequest.method, 'POST');
    assert.equal(roleRequest.url, 'https://api.healthcare.cantero.ar/users/219/roles');
    assert.equal(roleRequest.options.headers.Authorization, 'Bearer service-token');
    assert.equal(roleRequest.options.headers['x-request-id'], 'req-789');
    assert.equal(roleRequest.options.body, JSON.stringify({ role_id: 10 }));
    assert.equal(roleRequest.context.userId, 219);
    assert.equal(roleRequest.context.roleId, 10);
});

test('register rejects when default role assignment fails', async () => {
    const client = new CoreClient({
        email: 'service@example.com',
        password: 'secret',
    });

    client.fetchCore = async (method, url, options, context) => {
        if (context.operation === 'registerPassthrough') {
            return {
                status: 201,
                headers: {
                    get(name) {
                        return name === 'content-type' ? 'application/json' : null;
                    },
                },
                async text() {
                    return '{"user":{"id":219},"token":"registered-user-token"}';
                },
            };
        }

        if (context.operation === 'getAccessToken') {
            return {
                ok: true,
                status: 200,
                async text() {
                    return '{"token":"service-token"}';
                },
            };
        }

        return {
            ok: false,
            status: 403,
            async text() {
                return '{"error":"insufficient permissions"}';
            },
        };
    };

    await assert.rejects(
        () => client.register({
            email: 'patient@example.com',
            first_name: 'Patient',
            last_name: 'Example',
            password: 'secret',
        }, 'req-999'),
        /Failed to assign default role to registered user 219\. Status: 403/
    );
});

test('exchangeSsoTicket posts the ticket to the configured Core SSO endpoint', async () => {
    const client = new CoreClient({
        ssoExchangeUrl: 'https://api.healthcare.cantero.ar/auth/sso-exchange',
    });
    let capturedRequest;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            ok: true,
            status: 200,
            async json() {
                return { token: 'jwt-token', user: { id: 42 } };
            },
        };
    };

    const response = await client.exchangeSsoTicket('opaque-ticket');

    assert.equal(capturedRequest.method, 'POST');
    assert.equal(capturedRequest.url, 'https://api.healthcare.cantero.ar/auth/sso-exchange');
    assert.equal(capturedRequest.options.body, JSON.stringify({ ticket: 'opaque-ticket' }));
    assert.equal(capturedRequest.context.operation, 'exchangeSsoTicket');
    assert.deepEqual(response, {
        success: true,
        status: 200,
        data: { token: 'jwt-token', user: { id: 42 } },
    });
});

test('createSsoTicket posts without body using the user bearer token', async () => {
    const client = new CoreClient({
        ssoTicketUrl: 'https://api.healthcare.cantero.ar/auth/sso-ticket',
    });
    let capturedRequest;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            status: 200,
            headers: {
                get(name) {
                    return name === 'content-type' ? 'application/json' : null;
                },
            },
            async text() {
                return '{"ticket":"sso-ticket"}';
            },
        };
    };

    const response = await client.createSsoTicket('user-token', 'req-ticket');

    assert.equal(capturedRequest.method, 'POST');
    assert.equal(capturedRequest.url, 'https://api.healthcare.cantero.ar/auth/sso-ticket');
    assert.equal(capturedRequest.options.body, undefined);
    assert.equal(capturedRequest.options.headers.Authorization, 'Bearer user-token');
    assert.equal(capturedRequest.options.headers['x-request-id'], 'req-ticket');
    assert.equal(capturedRequest.context.operation, 'createSsoTicketPassthrough');
    assert.deepEqual(response, {
        status: 200,
        contentType: 'application/json',
        body: '{"ticket":"sso-ticket"}',
    });
});

test('getJwks reads from the configured Core JWKS endpoint', async () => {
    const client = new CoreClient({
        jwksUrl: 'https://api.healthcare.cantero.ar/.well-known/jwks.json',
    });
    let capturedRequest;

    client.fetchCore = async (method, url, options, context) => {
        capturedRequest = { method, url, options, context };

        return {
            ok: true,
            status: 200,
            async text() {
                return JSON.stringify({ keys: [] });
            },
        };
    };

    const jwks = await client.getJwks();

    assert.equal(capturedRequest.method, 'GET');
    assert.equal(capturedRequest.url, 'https://api.healthcare.cantero.ar/.well-known/jwks.json');
    assert.equal(capturedRequest.context.operation, 'getJwks');
    assert.deepEqual(jwks, { keys: [] });
});
