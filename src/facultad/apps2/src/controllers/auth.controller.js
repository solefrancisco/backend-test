class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async ssoCallback(req, res, next) {
        try {
            const { ticket, redirect } = req.query;

            if (!ticket) {
                return res.redirect('/login');
            }

            const exchanged = await this.authService.exchangeSsoTicket(ticket);
            if (!exchanged.success) {
                return res.redirect('/login');
            }

            const target = this.authService.getSafeRedirect(redirect);
            res.cookie('session', exchanged.data.token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });

            return res.redirect(target);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { AuthController };
