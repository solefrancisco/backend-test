const { BadRequestError } = require('@apps2/errors/bad-request-error');
const { NotFoundError } = require('@apps2/errors/not-found-error');
const { InternalServerError } = require('@apps2/errors/internal-server-error');
const { paginationConfig } = require('@apps2/configs/pagination.config');

class AppointmentsService {
    constructor(appointmentsRepository) {
        this.appointmentsRepository = appointmentsRepository;
    }

    async createAppointment(data) {
        const result = await this.appointmentsRepository.create(data);
        if (!result.success) {
            if (result.sqlState === '45000') {
                throw new BadRequestError('Scheduling conflict: Medic, patient, or center is not available at the requested time');
            }

            throw new InternalServerError('Failed to create appointment: ' + result.errorMessage);
        }
        
        return { appointment_id: result.data };
    }

    async getAppointments(query) {
        const quantity = await this.appointmentsRepository.count(query);
        if (!quantity.success) {
            throw new InternalServerError('Failed to paginate appointments: ' + quantity.errorMessage);
        }

        const totalItems = quantity.data;
        if (totalItems === 0) {
            throw new NotFoundError('No appointments found for the given criteria');
        }

        const totalPages = Math.ceil(totalItems / paginationConfig.defaultPageSize);
        if (query.page > totalPages) {
            throw new BadRequestError(`Page ${query.page} does not exist. Total pages: ${totalPages}`);
        }

        const result = await this.appointmentsRepository.findAll(paginationConfig.defaultPageSize, query);
        if (!result.success) {
            throw new InternalServerError('Failed to retrieve appointments: ' + result.errorMessage);
        }
        
        return {
            appointments: result.data,
            pagination: {
                totalItems: totalItems,
                totalPages: totalPages,
                itemsPerPage: paginationConfig.defaultPageSize
            }
        };
    }

    async getAppointmentById(id) {
        const response = await this.appointmentsRepository.findById(id);
        
        if (!response.success) {
            throw new InternalServerError('Failed to find appointment: ' + response.errorMessage);
        }

        if (!response.data) {
            throw new NotFoundError(`Appointment id ${id} not found`);
        }
        
        return response.data;
    }

}

module.exports = { AppointmentsService };