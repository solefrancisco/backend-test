class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async login(req, res, next) {
        try {
            const result = await this.authService.login(req.body || {}, req.headers['x-request-id']);

            return this.sendCoreResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const result = await this.authService.register(req.body || {}, req.headers['x-request-id']);

            return this.sendCoreResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const result = await this.authService.forgotPassword(req.body || {}, req.headers['x-request-id']);

            return this.sendCoreResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const result = await this.authService.resetPassword(req.body || {}, req.headers['x-request-id']);

            return this.sendCoreResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    async ssoTicket(req, res, next) {
        try {
            const auth = this.getRequestAuth(req);

            if (!auth.token) {
                console.warn(`[AUTH][SSO] ticket request without token requestId=${req.headers['x-request-id'] || 'none'} authorization=${auth.authorization} cookie=${auth.cookie}`);
                return res.status(401).json({
                    error: 'missing_auth_token',
                    message: 'No se recibio un JWT para generar el ticket SSO. Envia Authorization: Bearer <token> o llama con la cookie session.',
                    accepted_auth: [
                        'Authorization: Bearer <jwt>',
                        'Cookie: session=<jwt>',
                    ],
                    received: {
                        authorization: auth.authorization,
                        cookie: auth.cookie,
                    },
                });
            }

            const result = await this.authService.createSsoTicket(auth.token, req.headers['x-request-id']);

            return this.sendCoreResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    async ssoCallback(req, res, next) {
        const startedAt = performance.now();
        const requestId = req.headers['x-request-id'] || req.query.correlation_id || 'none';

        try {
            const { ticket, redirect } = req.query;

            console.log(`[AUTH][SSO] -> callback requestId=${requestId} hasTicket=${Boolean(ticket)} redirect=${redirect || 'none'} path=${req.originalUrl}`);

            if (!ticket) {
                return this.redirectToLogin(res, requestId, 'missing ticket');
            }

            console.log(`[AUTH][SSO] exchanging ticket requestId=${requestId} ticketHash=${this.maskTicket(ticket)}`);
            const exchanged = await this.authService.exchangeSsoTicket(ticket);

            if (!exchanged.success) {
                const durationMs = Math.round(performance.now() - startedAt);
                return this.redirectToLogin(res, requestId, `exchange failed status=${exchanged.status} durationMs=${durationMs}`);
            }

            const target = this.authService.getSafeRedirect(redirect);
            const token = exchanged.data && exchanged.data.token;

            if (!token) {
                const durationMs = Math.round(performance.now() - startedAt);
                console.error(`[AUTH][SSO] exchange succeeded without token requestId=${requestId} durationMs=${durationMs}`);
                return this.redirectToLogin(res, requestId, `exchange succeeded without token durationMs=${durationMs}`);
            }

            res.cookie('session', exchanged.data.token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });

            const durationMs = Math.round(performance.now() - startedAt);
            console.log(`[AUTH][SSO] <- success requestId=${requestId} redirect=${target} durationMs=${durationMs} sessionCookie=set`);

            return res.redirect(target);
        } catch (error) {
            const durationMs = Math.round(performance.now() - startedAt);
            console.error(`[AUTH][SSO] error requestId=${requestId} durationMs=${durationMs} message="${error.message}"`);
            next(error);
        }
    }

    maskTicket(ticket) {
        const value = String(ticket);

        if (value.length <= 8) {
            return `${value.length}:***`;
        }

        return `${value.length}:${value.slice(0, 4)}***${value.slice(-4)}`;
    }

    redirectToLogin(res, requestId, reason) {
        const target = this.authService.getLoginRedirect();
        console.warn(`[AUTH][SSO] ${reason} requestId=${requestId}; redirecting to ${target}`);
        return res.redirect(target);
    }

    getRequestAuth(req) {
        const authorization = req.headers.authorization;

        if (authorization && authorization.startsWith('Bearer ')) {
            const token = authorization.slice('Bearer '.length).trim();
            return {
                token: token || null,
                authorization: token ? 'bearer_present' : 'bearer_empty',
                cookie: req.headers.cookie ? 'not_checked' : 'missing',
            };
        }

        if (authorization) {
            return {
                token: null,
                authorization: 'present_but_not_bearer',
                cookie: req.headers.cookie ? 'not_checked' : 'missing',
            };
        }

        const cookie = req.headers.cookie;
        if (!cookie) {
            return {
                token: null,
                authorization: 'missing',
                cookie: 'missing',
            };
        }

        const sessionCookie = cookie
            .split(';')
            .map(value => value.trim())
            .find(value => value.startsWith('session='));

        if (!sessionCookie) {
            return {
                token: null,
                authorization: 'missing',
                cookie: 'present_without_session',
            };
        }

        const token = decodeURIComponent(sessionCookie.slice('session='.length)).trim();
        return {
            token: token || null,
            authorization: 'missing',
            cookie: token ? 'session_present' : 'session_empty',
        };
    }

    sendCoreResponse(res, result) {
        if (result.contentType) {
            res.set('Content-Type', result.contentType);
        }

        if (!result.body) {
            return res.status(result.status).end();
        }

        return res.status(result.status).send(result.body);
    }
}

module.exports = { AuthController };
