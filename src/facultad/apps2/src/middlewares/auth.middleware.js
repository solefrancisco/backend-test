function createAuthMiddleware(coreClient) {
    return async function authMiddleware(req, res, next) {
        try {
            const token = getToken(req);

            if (!token) {
                return res.status(401).json({ error: 'no session' });
            }

            const payload = await coreClient.verifyToken(token);
            req.user = {
                id: payload.user_id,
                permissions: payload.permissions || [],
            };

            next();
        } catch {
            return res.status(401).json({ error: 'invalid token' });
        }
    };
}

function getToken(req) {
    const authorization = req.headers.authorization;

    if (authorization && authorization.startsWith('Bearer ')) {
        return authorization.slice('Bearer '.length);
    }

    const cookie = req.headers.cookie;
    if (!cookie) {
        return null;
    }

    const sessionCookie = cookie
        .split(';')
        .map(value => value.trim())
        .find(value => value.startsWith('session='));

    if (!sessionCookie) {
        return null;
    }

    return decodeURIComponent(sessionCookie.slice('session='.length));
}

module.exports = { createAuthMiddleware };
