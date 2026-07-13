const { Router } = require('express');

function AuthRouter(authController) {
    const router = Router();

    router.get('/sso', (req, res, next) => authController.ssoCallback(req, res, next));

    return router;
}

module.exports = { AuthRouter };
