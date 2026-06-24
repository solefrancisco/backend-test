const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { NotFoundError } = require('@apps2/errors/not-found.error');
const { InternalServerError } = require('@apps2/errors/internal-server.error');
const { paginationConfig } = require('@apps2/configs/pagination.config');

class MedicalCentersService {
    constructor (medicalcenterRepository) {
        this.medicalcenterRepository= medicalcenterRepository;
    }

    async getMedicalCenters (query) {
        const quantity = await this.medicalcenterRepository.count(query);
        if (!quantity.success) 
            throw new InternalServerError ('Failed to paginate medical centers: ' + quantity.errorMessage);

        const totalItems = quantity.data;
        if (totalItems===0) 
            throw new NotFoundError ('No medical centers found for the given criteria');

        const totalPages = Math.ceil(totalItems / paginationConfig.defaultPageSize);
        if (query.page > totalPages)
            throw new BadRequestError(`Page ${query.page} does not exist. Total pages: ${totalPages}`);

        const result = await this.medicalcenterRepository.findAll(paginationConfig.defaultPageSize, query);
        if (!result.success) 
            throw new BadRequestError ('Failed to retrieve medical centers: ' + result.errorMessage);
        
        return {
            medical_centers: result.data,
            pagination: {
                total_medical_centers: totalItems,
                total_pages: totalPages,
                medical_centers_per_page: paginationConfig.defaultPageSize
            }
        };
    }

    async getMedicalCentersById (id) {
        const response = await this.medicalcenterRepository.findById (id);
        if (!response.success) 
            throw new BadRequestError ('Failed to retrieve medical center: ' + response.errorMessage);

        if (!response.data) 
            throw new NotFoundError (`Medical center id ${id} not found`)

        return response.data;
    };

}

module.exports = { MedicalCentersService };