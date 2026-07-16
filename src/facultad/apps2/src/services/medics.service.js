const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { InternalServerError } = require('@apps2/errors/internal-server.error');
const { NotFoundError } = require('@apps2/errors/not-found.error');

class MedicsService {
    constructor(medicsRepository, coreClient, specialitiesService = null) {
        this.medicsRepository = medicsRepository;
        this.coreClient = coreClient;
        this.specialitiesService = specialitiesService;
        this.medicsCache = [];
        this.refreshPromise = null;
    }

    async getMedics(query = {}) {
        if (this.refreshPromise) {
            await this.refreshPromise;
        }

        return query.speciality_id
            ? this.medicsCache.filter((medic) => medic.speciality_id === query.speciality_id)
            : this.medicsCache;
    }

    async createMedic(data) {
        if (this.refreshPromise) {
            await this.refreshPromise;
        }

        await this.validateMedicIsNotAlreadyCached(data.medic_id);
        await this.validateLocalSpecialityExists(data.speciality_id);
        await this.validateCoreSpecialityExists(data.speciality_id);
        const medics = await this.getMedicsFromCore(data.medic_id);

        const result = await this.medicsRepository.saveId(data.medic_id);
        if (!result.success) {
            throw new InternalServerError('Failed to save cached medic id: ' + result.errorMessage);
        }

        this.upsertMedicsInCache(data.medic_id, medics);

        return medics;
    }

    async refreshMedicsCache() {
        this.refreshPromise = this.loadMedicsCache();

        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    async loadMedicsCache() {
        const result = await this.medicsRepository.findAllIds();
        if (!result.success) {
            throw new InternalServerError('Failed to retrieve cached medic ids: ' + result.errorMessage);
        }

        if (this.coreClient && typeof this.coreClient.getAccessToken === 'function') {
            await this.coreClient.getAccessToken();
        }

        const responses = await Promise.allSettled(
            result.data.map((medic) => this.getMedicsFromCore(medic.medic_id))
        );
        const medics = responses
            .filter((response) => response.status === 'fulfilled' && response.value)
            .flatMap((response) => response.value);

        this.medicsCache = medics;
        console.log(`[MEDICS] Cache refreshed with ${medics.length} medic speciality rows from ${result.data.length} medics`);

        responses
            .filter((response) => response.status === 'rejected')
            .forEach((response) => console.warn('[MEDICS] Failed to hydrate cached medic from Core', response.reason));

        return this.medicsCache;
    }

    async getMedicsFromCore(medicId) {
        if (!this.coreClient) {
            throw new InternalServerError('Core client is required to hydrate cached medics');
        }

        const response = await this.coreClient.getUserById(medicId);
        if (!response.success) {
            throw new InternalServerError(`Failed to retrieve medic ${medicId} from Core. Status: ${response.status}`);
        }

        if (!this.isValidCoreUser(response.data)) {
            throw new InternalServerError(`Core medic ${medicId} response is invalid`);
        }

        return this.mapCoreUserToMedic(response.data);
    }

    async validateMedicIsNotAlreadyCached(medicId) {
        if (typeof this.medicsRepository.findById !== 'function') {
            throw new InternalServerError('Medics repository is required to validate cached medic ids');
        }

        const response = await this.medicsRepository.findById(medicId);
        if (!response.success) {
            throw new InternalServerError('Failed to validate cached medic id: ' + response.errorMessage);
        }

        if (response.data) {
            throw new BadRequestError(`medic_id ${medicId} is already cached`);
        }
    }

    async validateLocalSpecialityExists(specialityId) {
        if (!this.specialitiesService) {
            throw new InternalServerError('Specialities service is required to validate local speciality data');
        }

        try {
            await this.specialitiesService.getSpecialityById(specialityId);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw new BadRequestError(`speciality_id ${specialityId} does not exist locally`);
            }

            throw error;
        }
    }

    async validateCoreSpecialityExists(specialityId) {
        if (!this.coreClient || typeof this.coreClient.getSpecialityById !== 'function') {
            throw new InternalServerError('Core client is required to validate Core speciality data');
        }

        const response = await this.coreClient.getSpecialityById(specialityId);
        if (!response.success) {
            if (response.status === 404) {
                throw new BadRequestError(`speciality_id ${specialityId} does not exist in Core`);
            }

            throw new InternalServerError(`Failed to retrieve speciality ${specialityId} from Core. Status: ${response.status}`);
        }
    }

    isValidCoreUser(user) {
        return Boolean(user && typeof user === 'object' && user.id && user.email);
    }

    mapCoreUserToMedic(user) {
        const specialities = Array.isArray(user.specialities) && user.specialities.length > 0
            ? user.specialities
            : [null];
        const baseMedic = {
            medic_id: user.id,
            fullname: this.normalizeFullname([user.first_name, user.last_name].filter(Boolean).join(' ')),
            email: user.email,
        };

        return specialities.map((speciality) => ({
            ...baseMedic,
            speciality_id: speciality ? speciality.id : null,
            speciality_name: speciality ? speciality.name : null,
        }));
    }

    normalizeFullname(fullname) {
        return String(fullname)
            .replace(/\d+/g, '')
            .replace(/Medico/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    upsertMedicsInCache(medicId, medics) {
        this.medicsCache = this.medicsCache
            .filter((cachedMedic) => cachedMedic.medic_id !== medicId)
            .concat(medics)
            .sort((a, b) => {
                if (a.medic_id !== b.medic_id) {
                    return a.medic_id - b.medic_id;
                }

                return (a.speciality_id || 0) - (b.speciality_id || 0);
            });
    }
}

module.exports = { MedicsService };
