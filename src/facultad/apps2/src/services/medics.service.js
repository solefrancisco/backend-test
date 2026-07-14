class MedicsService {
    constructor(coreClient, medicUserIds) {
        this.coreClient = coreClient;
        this.medicUserIds = medicUserIds;
        this.medicsCache = [];
    }

    getMedics(query = {}) {
        const specialityId = query.speciality_id;
        const data = specialityId
            ? this.medicsCache.filter((medic) => medic.speciality_id === specialityId)
            : this.medicsCache;

        return { data };
    }

    async refreshMedicsCache() {
        if (!this.coreClient) {
            console.warn('[MEDICS] Core client is not available. Medics cache was not refreshed.');
            return this.medicsCache;
        }

        await this.coreClient.getAccessToken();

        const results = await Promise.allSettled(
            this.medicUserIds.map((userId) => this.getMedicFromCore(userId))
        );

        const medics = results
            .filter((result) => result.status === 'fulfilled' && result.value)
            .map((result) => result.value);

        this.medicsCache = medics;
        console.log(`[MEDICS] Cache refreshed with ${medics.length}/${this.medicUserIds.length} medics`);

        results
            .filter((result) => result.status === 'rejected')
            .forEach((result) => console.warn('[MEDICS] Failed to load medic from Core', result.reason));

        return this.medicsCache;
    }

    async getMedicFromCore(userId) {
        const response = await this.coreClient.getUserById(userId);

        if (!response.success) {
            console.warn(`[MEDICS] Core user request failed userId=${userId} status=${response.status} response="${this.formatCoreResponseForLog(response.data)}"`);
            return null;
        }

        if (!this.isValidCoreUser(response.data)) {
            console.warn(`[MEDICS] Core user response is invalid userId=${userId} status=${response.status} response="${this.formatCoreResponseForLog(response.data)}"`);
            return null;
        }

        return this.mapCoreUserToMedic(response.data);
    }

    isValidCoreUser(user) {
        return Boolean(user && typeof user === 'object' && user.email);
    }

    formatCoreResponseForLog(data, maxLength = 500) {
        const value = data && typeof data === 'object' && Object.hasOwn(data, 'raw')
            ? data.raw
            : JSON.stringify(data || {});
        const flatValue = String(value).replace(/\s+/g, ' ').trim();

        if (flatValue.length <= maxLength) {
            return flatValue;
        }

        return `${flatValue.slice(0, maxLength)}...`;
    }

    mapCoreUserToMedic(user) {
        const speciality = Array.isArray(user.specialities) ? user.specialities[0] : null;

        return {
            fullname: [user.first_name, user.last_name].filter(Boolean).join(' '),
            email: user.email,
            speciality_id: speciality ? speciality.id : null,
            speciality_name: speciality ? speciality.name : null,
        };
    }
}

module.exports = { MedicsService };
