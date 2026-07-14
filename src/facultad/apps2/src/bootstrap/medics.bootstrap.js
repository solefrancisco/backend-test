const { MedicsController } = require('@apps2/controllers/medics.controller');
const { medicUserIds } = require('@apps2/configs/medics.config');
const { MedicsService } = require('@apps2/services/medics.service');

function buildMedicsController(coreClient) {
    const medicsService = new MedicsService(coreClient, medicUserIds);
    startMedicsCacheRefresh(medicsService);

    return new MedicsController(medicsService);
}

function startMedicsCacheRefresh(medicsService) {
    medicsService.refreshMedicsCache().catch((error) => {
        console.error('Failed to refresh medics cache', error);
    });
}

module.exports = { buildMedicsController };
