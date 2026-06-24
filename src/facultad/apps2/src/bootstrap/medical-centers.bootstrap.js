const { MedicalCentersController } = require('@apps2/controllers/medical-centers.controller');
const { MedicalCentersService } = require('@apps2/services/medical-centers.service');

function buildMedicalCentersController () {
    const medicalCentersService = new MedicalCentersService (buildMedicalCentersRepository ());
    return new MedicalCentersController (medicalCentersService);
}

function buildMedicalCentersRepository () {
    return buildMySqlRepository();
}

function buildMySqlRepository () {
    const { dbPool } = require('@apps2/configs/database.config');
    const { MySqlMedicalCentersRepository } = require('@apps2/repositories/medical-centers.repository');
    return new MySqlMedicalCentersRepository(dbPool);
}

module.exports = { buildMedicalCentersController };
