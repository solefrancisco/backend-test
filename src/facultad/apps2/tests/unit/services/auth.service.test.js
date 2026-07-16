const test = require('node:test');
const assert = require('node:assert/strict');

const { AuthService } = require('@apps2/services/auth.service');

test('getSafeRedirect resolves relative redirects against the frontend host', () => {
    const service = new AuthService({}, {
        ssoFrontendBaseUrl: 'https://turnos.solefrancisco.com',
        ssoRedirectFallback: 'https://turnos.solefrancisco.com/',
        ssoLoginRedirect: 'https://turnos.solefrancisco.com/login',
    });

    assert.equal(
        service.getSafeRedirect('/appointments?tab=mine'),
        'https://turnos.solefrancisco.com/appointments?tab=mine'
    );
});

test('getSafeRedirect accepts absolute redirects to any domain', () => {
    const service = new AuthService({}, {
        ssoFrontendBaseUrl: 'https://turnos.solefrancisco.com',
        ssoRedirectFallback: 'https://turnos.solefrancisco.com/',
        ssoLoginRedirect: 'https://turnos.solefrancisco.com/login',
    });

    assert.equal(
        service.getSafeRedirect('https://turnos.solefrancisco.com/agenda'),
        'https://turnos.solefrancisco.com/agenda'
    );
    assert.equal(
        service.getSafeRedirect('https://example.com/phishing'),
        'https://example.com/phishing'
    );
});

test('getLoginRedirect always points to the configured frontend login', () => {
    const service = new AuthService({}, {
        ssoFrontendBaseUrl: 'https://turnos.solefrancisco.com',
        ssoRedirectFallback: 'https://turnos.solefrancisco.com/',
        ssoLoginRedirect: '/login',
    });

    assert.equal(service.getLoginRedirect(), 'https://turnos.solefrancisco.com/login');
});
