const { Router } = require('express');

function AuthRouter(authController) {
    const router = Router();

    router.post('/login', (req, res, next) => authController.login(req, res, next));
    router.post('/register', (req, res, next) => authController.register(req, res, next));
    router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
    router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));
    router.post('/sso-ticket', (req, res, next) => authController.ssoTicket(req, res, next));
    router.get('/sso', (req, res, next) => authController.ssoCallback(req, res, next));

    return router;
}

module.exports = { AuthRouter };
