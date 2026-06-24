const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { NotFoundError } = require('@apps2/errors/not-found.error');
const { InternalServerError } = require('@apps2/errors/internal-server.error');
const { paginationConfig } = require('@apps2/configs/pagination.config');

class SpecialitiesService {
    constructor(specialitiesRepository) {
        this.specialitiesRepository = specialitiesRepository;
    }

    async getSpecialities(query) {
        const quantity = await this.specialitiesRepository.count(query);
        if (!quantity.success)
            throw new InternalServerError('Failed to paginate specialities: ' + quantity.errorMessage);

        const totalItems = quantity.data;
        if (totalItems === 0)
            throw new NotFoundError('No specialities found for the given criteria');

        const totalPages = Math.ceil(totalItems / paginationConfig.defaultPageSize);
        if (query.page > totalPages)
            throw new BadRequestError(`Page ${query.page} does not exist. Total pages: ${totalPages}`);

        const result = await this.specialitiesRepository.findAll(paginationConfig.defaultPageSize, query);
        if (!result.success)
            throw new InternalServerError('Failed to retrieve specialities: ' + result.errorMessage);
        
        return {
            specialities: result.data,
            pagination: {
                total_specialities: totalItems,
                total_pages: totalPages,
                specialities_per_page: paginationConfig.defaultPageSize
            }
        };
    }

    async getSpecialityById(id) {
        const response = await this.specialitiesRepository.findById(id);
        
        if (!response.success)
            throw new InternalServerError('Failed to find speciality: ' + response.errorMessage);

        if (!response.data)
            throw new NotFoundError(`Speciality id ${id} not found`);
        
        return response.data;
    }
}

module.exports = { SpecialitiesService };