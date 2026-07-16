function createAuthMiddleware(coreClient) {
    return async function authMiddleware(req, res, next) {
        try {
            const token = getToken(req);

            if (!token) {
                return res.status(401).json({
                    error: 'missing_auth_token',
                    message: 'No se recibio un JWT para autenticar la request. Envia Authorization: Bearer <token> o llama con la cookie session.',
                    accepted_auth: [
                        'Authorization: Bearer <jwt>',
                        'Cookie: session=<jwt>',
                    ],
                });
            }

            const payload = await coreClient.verifyToken(token);
            req.user = {
                id: payload.user_id,
                permissions: payload.permissions || [],
            };

            next();
        } catch (error) {
            return res.status(401).json({
                error: 'invalid_auth_token',
                message: 'El JWT recibido no es valido, expiro o no pudo validarse contra el JWKS de Core.',
                detail: error.message,
            });
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
