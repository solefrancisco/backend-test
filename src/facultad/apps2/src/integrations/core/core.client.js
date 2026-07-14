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
        const url = `${this.config.baseUrl}/auth/sso-exchange`;
        const response = await this.fetchCore('POST', url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket }),
            }, { operation: 'exchangeSsoTicket' });

        if (!response.ok) {
            return { success: false, status: response.status };
        }

        const data = await response.json();
        return { success: true, status: response.status, data };
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
        const response = await this.getAuthenticatedJson(`/specialities/${id}`, token, requestId);

        if (response.status === 401) {
            this.logCoreRetry('GET', `${this.config.baseUrl}/specialities/${id}`, requestId, 'received 401 while getting speciality');
            this.clearAccessToken();
            const refreshedToken = await this.getAccessToken();
            return await this.getAuthenticatedJson(`/specialities/${id}`, refreshedToken, requestId);
        }

        return response;
    }

    async getUserById(id, requestId) {
        const token = await this.getAccessToken();
        const response = await this.getAuthenticatedJson(`/users/${id}`, token, requestId);

        if (response.status === 401) {
            this.logCoreRetry('GET', `${this.config.baseUrl}/users/${id}`, requestId, 'received 401 while getting user');
            this.clearAccessToken();
            const refreshedToken = await this.getAccessToken();
            return await this.getAuthenticatedJson(`/users/${id}`, refreshedToken, requestId);
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
        return { success: response.ok, status: response.status, data };
    }

    async getAuthenticatedJson(path, token, requestId) {
        const url = `${this.config.baseUrl}${path}`;
        return await this.getAuthenticatedJsonUrl(url, token, requestId);
    }

    async getAuthenticatedJsonUrl(url, token, requestId) {
        const response = await this.fetchCore('GET', url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(requestId ? { 'x-request-id': requestId } : {}),
            },
        }, {
            requestId,
            operation: 'getAuthenticatedJson',
        });

        const data = await this.readJson(response);
        return { success: response.ok, status: response.status, data };
    }

    async getAccessToken() {
        if (this.accessToken && this.accessTokenExpiresAt > Date.now()) {
            return this.accessToken;
        }

        if (this.accessTokenPromise) {
            console.log('[CORE] Waiting for in-flight access token request');
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

        const data = await this.readJson(response);
        if (!response.ok) {
            throw new Error(`Core login failed with status ${response.status}`);
        }

        const token = data.token || data.access_token;
        if (!token) {
            throw new Error('Core login response did not include a token');
        }

        this.accessToken = token;
        this.accessTokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
        console.log(`[CORE] Access token cached until ${new Date(this.accessTokenExpiresAt).toISOString()}`);

        return this.accessToken;
    }

    clearAccessToken() {
        if (this.accessToken) {
            console.warn('[CORE] Clearing cached access token');
        }
        this.accessToken = null;
        this.accessTokenExpiresAt = 0;
        this.accessTokenPromise = null;
    }

    async findJwk(kid) {
        console.log(`[CORE] Looking up JWKS key kid=${kid || 'missing'}`);
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
            console.log(`[CORE] Using cached JWKS until ${new Date(this.jwksExpiresAt).toISOString()}`);
            return this.jwks;
        }

        const url = 'https://gw.healthcare.cantero.ar/.well-known/jwks.json';
        const response = await this.fetchCore('GET', url, undefined, { operation: 'getJwks' });
        const data = await this.readJson(response);

        if (!response.ok) {
            throw new Error(`Could not retrieve Core JWKS. Status ${response.status}`);
        }

        this.jwks = data;
        this.jwksExpiresAt = Date.now() + 5 * 60 * 1000;
        console.log(`[CORE] JWKS cached with ${Array.isArray(data.keys) ? data.keys.length : 0} keys until ${new Date(this.jwksExpiresAt).toISOString()}`);

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
            console.warn(`[CORE] Response body is not valid JSON. status=${response.status} body="${this.truncateForLog(text)}"`);
            return { raw: text };
        }
    }

    async fetchCore(method, url, options, context = {}) {
        const startedAt = this.logCoreRequest(method, url, context);

        try {
            const response = await fetch(url, options);
            this.logCoreResponse(method, url, response, startedAt, context);
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
        const durationMs = Math.round(performance.now() - startedAt);
        const log = response.ok ? console.log : console.warn;
        log(`[CORE] <- ${method} ${url} status=${response.status} durationMs=${durationMs} ${this.formatLogContext(context)}`);
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
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
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
}

module.exports = { CoreClient };
