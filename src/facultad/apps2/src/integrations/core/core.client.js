const crypto = require('crypto');

class CoreClient {
    constructor(config) {
        this.config = config;
        this.accessToken = null;
        this.accessTokenExpiresAt = 0;
        this.accessTokenPromise = null;
        this.jwks = null;
        this.jwksExpiresAt = 0;
    }

    async exchangeSsoTicket(ticket) {
        const url = this.config.ssoExchangeUrl || `${this.config.baseUrl}/auth/sso-exchange`;
        const context = { operation: 'exchangeSsoTicket' };
        const response = await this.fetchCore('POST', url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket }),
            }, context);

        if (!response.ok) {
            const data = await this.readJson(response);
            this.logCoreResponseFailure('POST', url, response, data, context);
            return { success: false, status: response.status };
        }

        const data = await response.json();
        return { success: true, status: response.status, data };
    }

    async createSsoTicket(token, requestId) {
        const url = this.config.ssoTicketUrl || 'https://api.healthcare.cantero.ar/auth/sso-ticket';
        const context = {
            requestId,
            operation: 'createSsoTicketPassthrough',
        };
        const response = await this.fetchCore('POST', url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(requestId ? { 'x-request-id': requestId } : {}),
            },
        }, context);
        const body = await response.text();
        this.logCorePassthroughFailure('POST', url, response, body, context);

        return {
            status: response.status,
            contentType: response.headers && response.headers.get
                ? response.headers.get('content-type')
                : null,
            body,
        };
    }

    async login(credentials, requestId) {
        return await this.postAuthPassthrough('/login', credentials, requestId, 'loginPassthrough');
    }

    async forgotPassword(payload, requestId) {
        return await this.postAuthPassthrough('/forgot-password', payload, requestId, 'forgotPasswordPassthrough');
    }

    async resetPassword(payload, requestId) {
        return await this.postAuthPassthrough('/reset-password', payload, requestId, 'resetPasswordPassthrough');
    }

    async register(payload, requestId) {
        const result = await this.postAuthPassthrough('/register', payload, requestId, 'registerPassthrough');

        await this.assignRegisteredUserPatientRole(result, requestId);

        return result;
    }

    async postAuthPassthrough(path, payload, requestId, operation) {
        const url = `https://gw.healthcare.cantero.ar/api/auth${path}`;
        const context = {
            requestId,
            operation,
            email: this.maskEmail(payload && payload.email),
        };
        if (operation === 'registerPassthrough') {
            context.deferResponseLog = true;
        }
        const response = await this.fetchCore('POST', url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(requestId ? { 'x-request-id': requestId } : {}),
            },
            body: JSON.stringify(payload),
        }, context);
        const body = await response.text();
        if (operation === 'registerPassthrough') {
            const registeredUserId = this.getRegisteredUserIdFromBody(body);
            if (registeredUserId) {
                context.registeredUserId = registeredUserId;
            }
            this.logCoreResponse('POST', url, response, performance.now(), context);
        }
        this.logCorePassthroughFailure('POST', url, response, body, context);

        return {
            status: response.status,
            contentType: response.headers && response.headers.get
                ? response.headers.get('content-type')
                : null,
            body,
        };
    }

    async assignRegisteredUserPatientRole(registerResult, requestId) {
        if (registerResult.status < 200 || registerResult.status >= 300) {
            return;
        }

        const userId = this.getRegisteredUserId(registerResult.body);
        if (!userId) {
            throw new Error('Core register response did not include user id to assign default role');
        }

        const response = await this.assignUserRole(userId, 10, requestId);

        if (!response.success) {
            throw new Error(`Failed to assign default role to registered user ${userId}. Status: ${response.status}`);
        }
    }

    getRegisteredUserId(body) {
        const userId = this.getRegisteredUserIdFromBody(body);

        if (userId) {
            return userId;
        }

        if (!body) {
            return null;
        }

        try {
            JSON.parse(body);
            return null;
        } catch (error) {
            console.warn(`[CORE] Register response body is not valid JSON; skipping default role assignment body="${this.truncateForLog(body)}"`);
            return null;
        }
    }

    getRegisteredUserIdFromBody(body) {
        if (!body) {
            return null;
        }

        try {
            const data = JSON.parse(body);
            return data && data.user && data.user.id
                ? data.user.id
                : data && data.id ? data.id : null;
        } catch (error) {
            return null;
        }
    }

    async assignUserRole(userId, roleId, requestId) {
        const token = await this.getAccessToken();
        const response = await this.postUserRole(userId, roleId, token, requestId);

        if (response.status === 401) {
            this.logCoreRetry('POST', this.getUserRoleUrl(userId), requestId, 'received 401 while assigning user role');
            this.clearAccessToken();
            const refreshedToken = await this.getAccessToken();
            return await this.postUserRole(userId, roleId, refreshedToken, requestId);
        }

        return response;
    }

    async postUserRole(userId, roleId, token, requestId) {
        const url = this.getUserRoleUrl(userId);
        const response = await this.fetchCore('POST', url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(requestId ? { 'x-request-id': requestId } : {}),
            },
            body: JSON.stringify({ role_id: roleId }),
        }, {
            requestId,
            operation: 'assignUserRole',
            userId,
            roleId,
        });

        const context = {
            requestId,
            operation: 'assignUserRole',
            userId,
            roleId,
        };
        const data = await this.readJson(response);
        this.logCoreResponseFailure('POST', url, response, data, context);
        return { success: response.ok, status: response.status, data };
    }

    getUserRoleUrl(userId) {
        return `https://api.healthcare.cantero.ar/users/${userId}/roles`;
    }

    async publishEvent(eventTypeId, payload, requestId) {
        if (!eventTypeId) {
            throw new Error('Missing Core event_type_id');
        }

        const token = await this.getAccessToken();
        const response = await this.postEventLog(eventTypeId, payload, token, requestId);

        if (response.status === 401) {
            this.logCoreRetry('POST', `${this.config.baseUrl}/events/log`, requestId, 'received 401 while publishing event');
            this.clearAccessToken();
            const refreshedToken = await this.getAccessToken();
            return await this.postEventLog(eventTypeId, payload, refreshedToken, requestId);
        }

        return response;
    }

    async getSpecialityById(id, requestId) {
        const token = await this.getAccessToken();
        const response = await this.getAuthenticatedJson(`/specialities/${id}`, token, requestId, 'getSpecialityById');

        if (response.status === 401) {
            this.logCoreRetry('GET', `${this.config.baseUrl}/specialities/${id}`, requestId, 'received 401 while getting speciality');
            this.clearAccessToken();
            const refreshedToken = await this.getAccessToken();
            return await this.getAuthenticatedJson(`/specialities/${id}`, refreshedToken, requestId, 'getSpecialityById');
        }

        return response;
    }

    async getUserById(id, requestId) {
        const token = await this.getAccessToken();
        const response = await this.getAuthenticatedJson(`/users/${id}`, token, requestId, 'getUserById');

        if (response.status === 401) {
            this.logCoreRetry('GET', `${this.config.baseUrl}/users/${id}`, requestId, 'received 401 while getting user');
            this.clearAccessToken();
            const refreshedToken = await this.getAccessToken();
            return await this.getAuthenticatedJson(`/users/${id}`, refreshedToken, requestId, 'getUserById');
        }

        return response;
    }

    async verifyToken(token) {
        const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

        if (!encodedHeader || !encodedPayload || !encodedSignature) {
            throw new Error('Invalid JWT format');
        }

        const header = JSON.parse(this.decodeBase64Url(encodedHeader));
        if (header.alg !== 'RS256') {
            throw new Error('Invalid JWT algorithm');
        }

        const jwk = await this.findJwk(header.kid);
        const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(`${encodedHeader}.${encodedPayload}`);
        verifier.end();

        const signature = Buffer.from(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        if (!verifier.verify(key, signature)) {
            throw new Error('Invalid JWT signature');
        }

        const payload = JSON.parse(this.decodeBase64Url(encodedPayload));
        const now = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp <= now) {
            throw new Error('Expired JWT');
        }

        return payload;
    }

    async postEventLog(eventTypeId, payload, token, requestId) {
        const url = `${this.config.baseUrl}/events/log`;
        const response = await this.fetchCore('POST', url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(requestId ? { 'x-request-id': requestId } : {}),
            },
            body: JSON.stringify({
                event_type_id: eventTypeId,
                publisher_module: this.config.publisherModule,
                payload: JSON.stringify(payload),
            }),
        }, {
            requestId,
            operation: 'postEventLog',
            eventTypeId,
            publisherModule: this.config.publisherModule,
        });

        const data = await this.readJson(response);
        this.logCoreResponseFailure('POST', url, response, data, {
            requestId,
            operation: 'postEventLog',
            eventTypeId,
            publisherModule: this.config.publisherModule,
        });
        return { success: response.ok, status: response.status, data };
    }

    async getAuthenticatedJson(path, token, requestId, operation = 'getAuthenticatedJson') {
        const url = `${this.config.baseUrl}${path}`;
        return await this.getAuthenticatedJsonUrl(url, token, requestId, operation);
    }

    async getAuthenticatedJsonUrl(url, token, requestId, operation = 'getAuthenticatedJson') {
        const context = {
            requestId,
            operation,
        };
        const response = await this.fetchCore('GET', url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(requestId ? { 'x-request-id': requestId } : {}),
            },
        }, context);

        const data = await this.readJson(response);
        this.logCoreResponseFailure('GET', url, response, data, context);
        return { success: response.ok, status: response.status, data };
    }

    async getAccessToken() {
        if (this.accessToken && this.accessTokenExpiresAt > Date.now()) {
            return this.accessToken;
        }

        if (this.accessTokenPromise) {
            return await this.accessTokenPromise;
        }

        if (!this.config.email || !this.config.password) {
            throw new Error('Missing Core credentials');
        }

        this.accessTokenPromise = this.requestAccessToken();

        try {
            return await this.accessTokenPromise;
        } finally {
            this.accessTokenPromise = null;
        }
    }

    async requestAccessToken() {
        const url = 'https://gw.healthcare.cantero.ar/api/auth/login';
        const response = await this.fetchCore('POST', url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: this.config.email,
                password: this.config.password,
            }),
        }, {
            operation: 'getAccessToken',
            email: this.maskEmail(this.config.email),
        });

        const context = {
            operation: 'getAccessToken',
            email: this.maskEmail(this.config.email),
        };
        const data = await this.readJson(response);
        this.logCoreResponseFailure('POST', url, response, data, context);
        if (!response.ok) {
            throw new Error(`Core login failed with status ${response.status}`);
        }

        const token = data.token || data.access_token;
        if (!token) {
            throw new Error('Core login response did not include a token');
        }

        this.accessToken = token;
        this.accessTokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
        return this.accessToken;
    }

    clearAccessToken() {
        this.accessToken = null;
        this.accessTokenExpiresAt = 0;
        this.accessTokenPromise = null;
    }

    async findJwk(kid) {
        const jwks = await this.getJwks();
        const key = jwks.keys.find(item => item.kid === kid);

        if (!key) {
            console.warn(`[CORE] JWKS key kid=${kid || 'missing'} not found in cache. Refreshing JWKS`);
            this.jwks = null;
            const refreshedJwks = await this.getJwks();
            const refreshedKey = refreshedJwks.keys.find(item => item.kid === kid);

            if (!refreshedKey) {
                throw new Error('JWKS key not found');
            }

            return refreshedKey;
        }

        return key;
    }

    async getJwks() {
        if (this.jwks && this.jwksExpiresAt > Date.now()) {
            return this.jwks;
        }

        const url = this.config.jwksUrl || 'https://api.healthcare.cantero.ar/.well-known/jwks.json';
        const context = { operation: 'getJwks' };
        const response = await this.fetchCore('GET', url, undefined, context);
        const data = await this.readJson(response);
        this.logCoreResponseFailure('GET', url, response, data, context);

        if (!response.ok) {
            throw new Error(`Could not retrieve Core JWKS. Status ${response.status}`);
        }

        this.jwks = data;
        this.jwksExpiresAt = Date.now() + 5 * 60 * 1000;

        return this.jwks;
    }

    decodeBase64Url(value) {
        return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    }

    async readJson(response) {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            return { raw: text };
        }
    }

    async fetchCore(method, url, options, context = {}) {
        const startedAt = this.logCoreRequest(method, url, context);

        try {
            const response = await fetch(url, options);
            response.coreDurationMs = Math.round(performance.now() - startedAt);
            if (!context.deferResponseLog) {
                this.logCoreResponse(method, url, response, startedAt, context);
            }
            return response;
        } catch (error) {
            this.logCoreError(method, url, error, startedAt, context);
            throw error;
        }
    }

    logCoreRequest(method, url, context = {}) {
        const startedAt = performance.now();
        console.log(`[CORE] -> ${method} ${url} ${this.formatLogContext(context)}`);
        return startedAt;
    }

    logCoreResponse(method, url, response, startedAt, context = {}) {
        const durationMs = response.coreDurationMs || Math.round(performance.now() - startedAt);
        const log = this.isResponseOk(response) ? console.log : console.warn;
        log(`[CORE] <- ${method} ${url} status=${response.status} durationMs=${durationMs} ${this.formatLogContext(context)}`);
    }

    logCoreResponseFailure(method, url, response, data, context = {}) {
        if (this.isResponseOk(response)) {
            return;
        }

        console.warn(`[CORE] request failed ${method} ${url} status=${response.status} ${this.formatDurationContext(response)}response="${this.formatCoreResponseForLog(data)}" ${this.formatLogContext(context)}`);
    }

    logCorePassthroughFailure(method, url, response, body, context = {}) {
        if (this.isResponseOk(response)) {
            return;
        }

        console.warn(`[CORE] request failed ${method} ${url} status=${response.status} ${this.formatDurationContext(response)}response="${this.formatFlatResponseForLog(body)}" ${this.formatLogContext(context)}`);
    }

    logCoreRetry(method, url, requestId, reason) {
        console.warn(`[CORE] retry ${method} ${url} reason="${reason}" ${this.formatLogContext({ requestId })}`);
    }

    logCoreError(method, url, error, startedAt, context = {}) {
        const durationMs = Math.round(performance.now() - startedAt);
        console.error(`[CORE] !! ${method} ${url} durationMs=${durationMs} error="${error.message}" ${this.formatLogContext(context)}`);
    }

    formatLogContext(context) {
        const entries = Object.entries(context)
            .filter(([key, value]) => key !== 'deferResponseLog' && value !== undefined && value !== null && value !== '')
            .map(([key, value]) => `${key}=${value}`);

        return entries.length ? entries.join(' ') : '';
    }

    maskEmail(email) {
        const [name, domain] = String(email).split('@');

        if (!name || !domain) {
            return 'configured';
        }

        return `${name.slice(0, 2)}***@${domain}`;
    }

    truncateForLog(value, maxLength = 200) {
        const normalizedValue = String(value).replace(/\s+/g, ' ').trim();

        if (normalizedValue.length <= maxLength) {
            return normalizedValue;
        }

        return `${normalizedValue.slice(0, maxLength)}...`;
    }

    formatCoreResponseForLog(data, maxLength = 500) {
        const value = data && typeof data === 'object' && Object.hasOwn(data, 'raw')
            ? data.raw
            : JSON.stringify(data || {});

        return this.formatFlatResponseForLog(value, maxLength);
    }

    isResponseOk(response) {
        if (typeof response.ok === 'boolean') {
            return response.ok;
        }

        return response.status >= 200 && response.status < 300;
    }

    formatFlatResponseForLog(value, maxLength = 500) {
        return this.truncateForLog(value, maxLength).replace(/"/g, "'");
    }

    formatDurationContext(response) {
        return typeof response.coreDurationMs === 'number'
            ? `durationMs=${response.coreDurationMs} `
            : '';
    }
}

module.exports = { CoreClient };
