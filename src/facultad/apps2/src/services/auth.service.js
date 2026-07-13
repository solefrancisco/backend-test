class AuthService {
    constructor(coreClient, coreConfig) {
        this.coreClient = coreClient;
        this.coreConfig = coreConfig;
    }

    async exchangeSsoTicket(ticket) {
        return await this.coreClient.exchangeSsoTicket(ticket);
    }

    getSafeRedirect(redirect) {
        if (!redirect) {
            return this.coreConfig.ssoRedirectFallback;
        }

        if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/\\')) {
            return this.coreConfig.ssoRedirectFallback;
        }

        return redirect;
    }
}

module.exports = { AuthService };
