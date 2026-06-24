const { SpecialitiesController } = require('@apps2/controllers/specialities.controller');
const { SpecialitiesService } = require('@apps2/services/specialities.service');

function buildSpecialitiesController() {
    const specialitiesService = new SpecialitiesService(buildSpecialitiesRepository());
    return new SpecialitiesController(specialitiesService);
}

function buildSpecialitiesRepository() {
    return buildMySqlRepository();
}

function buildMySqlRepository() {
    const { dbPool } = require('@apps2/configs/database.config');
    const { MySqlSpecialitiesRepository } = require('@apps2/repositories/specialities.repository');
    return new MySqlSpecialitiesRepository(dbPool);
}

module.exports = { buildSpecialitiesController };