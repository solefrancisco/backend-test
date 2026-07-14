class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async ssoCallback(req, res, next) {
        const startedAt = performance.now();
        const requestId = req.headers['x-request-id'] || req.query.correlation_id || 'none';

        try {
            const { ticket, redirect } = req.query;

            console.log(`[AUTH][SSO] -> callback requestId=${requestId} hasTicket=${Boolean(ticket)} redirect=${redirect || 'none'} path=${req.originalUrl}`);

            if (!ticket) {
                console.warn(`[AUTH][SSO] missing ticket requestId=${requestId}; redirecting to /login`);
                return res.redirect('/login');
            }

            console.log(`[AUTH][SSO] exchanging ticket requestId=${requestId} ticketHash=${this.maskTicket(ticket)}`);
            const exchanged = await this.authService.exchangeSsoTicket(ticket);

            if (!exchanged.success) {
                const durationMs = Math.round(performance.now() - startedAt);
                console.warn(`[AUTH][SSO] exchange failed requestId=${requestId} status=${exchanged.status} durationMs=${durationMs}; redirecting to /login`);
                return res.redirect('/login');
            }

            const target = this.authService.getSafeRedirect(redirect);
            const token = exchanged.data.token;

            if (!token) {
                const durationMs = Math.round(performance.now() - startedAt);
                console.error(`[AUTH][SSO] exchange succeeded without token requestId=${requestId} durationMs=${durationMs}; redirecting to /login`);
                return res.redirect('/login');
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
}

module.exports = { AuthController };
