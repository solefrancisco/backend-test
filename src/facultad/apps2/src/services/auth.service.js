class AuthService {
    constructor(coreClient, coreConfig) {
        this.coreClient = coreClient;
        this.coreConfig = coreConfig;
    }

    async login(credentials, requestId) {
        return await this.coreClient.login(credentials, requestId);
    }

    async register(payload, requestId) {
        return await this.coreClient.register(payload, requestId);
    }

    async forgotPassword(payload, requestId) {
        return await this.coreClient.forgotPassword(payload, requestId);
    }

    async resetPassword(payload, requestId) {
        return await this.coreClient.resetPassword(payload, requestId);
    }

    async createSsoTicket(token, requestId) {
        return await this.coreClient.createSsoTicket(token, requestId);
    }

    async exchangeSsoTicket(ticket) {
        return await this.coreClient.exchangeSsoTicket(ticket);
    }

    getSafeRedirect(redirect) {
        const fallback = this.toFrontendUrl(this.coreConfig.ssoRedirectFallback);

        if (!redirect) {
            return fallback;
        }

        const target = this.toFrontendUrl(redirect);

        if (!target) {
            return fallback;
        }

        return target;
    }

    getLoginRedirect() {
        return this.toFrontendUrl(this.coreConfig.ssoLoginRedirect || '/login');
    }

    toFrontendUrl(value) {
        const frontendBaseUrl = this.getFrontendBaseUrl();

        try {
            const target = new URL(value, frontendBaseUrl);
            return target.toString();
        } catch (error) {
            return frontendBaseUrl.toString();
        }
    }

    getFrontendBaseUrl() {
        return new URL(this.coreConfig.ssoFrontendBaseUrl || 'https://turnos.solefrancisco.com');
    }
}

module.exports = { AuthService };
