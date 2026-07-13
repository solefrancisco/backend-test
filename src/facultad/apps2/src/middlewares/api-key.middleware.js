function createApiKeyMiddleware(expectedApiKey) {
    return function apiKeyMiddleware(req, res, next) {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey || apiKey !== expectedApiKey) {
            return res.status(401).json({ error: 'invalid api key' });
        }

        next();
    };
}

module.exports = { createApiKeyMiddleware };
