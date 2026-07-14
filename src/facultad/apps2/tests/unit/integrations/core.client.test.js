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
