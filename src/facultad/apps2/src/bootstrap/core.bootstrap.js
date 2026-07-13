const { coreConfig } = require('@apps2/configs/core.config');
const { mockConfig } = require('@apps2/configs/mock.config');
const { CoreClient } = require('@apps2/integrations/core/core.client');
const { AuthService } = require('@apps2/services/auth.service');
const { AuthController } = require('@apps2/controllers/auth.controller');
const { AuthRouter } = require('@apps2/routes/auth.route');
const { createAuthMiddleware } = require('@apps2/middlewares/auth.middleware');

function buildCoreClient() {
    if (mockConfig.enabled || !coreConfig.enabled) {
        return null;
    }

    return new CoreClient(coreConfig);
}

function buildAuthController(coreClient = buildCoreClient()) {
    if (!coreClient) {
        return null;
    }

    return new AuthController(new AuthService(coreClient, coreConfig));
}

function buildAuthMiddleware(coreClient = buildCoreClient()) {
    if (!coreClient) {
        return null;
    }

    return createAuthMiddleware(coreClient);
}

module.exports = {
    buildCoreClient,
    buildAuthController,
    buildAuthMiddleware,
    AuthRouter,
};
