class AppointmentsController {
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }

    async createAppointment(req, res, next) {
        try {
            const data = req.validatedRequest.body;
            const appointment = await this.appointmentsService.createAppointment(data);

            res.status(201).json(appointment);
        } catch (error) {
            next(error);
        }   
    }

    async getAppointments(req, res, next) {
        try {
            const query = req.validatedRequest.query;
            const appointments = await this.appointmentsService.searchAppointments(query);

            res.status(200).json(appointments);
        } catch (error) {
            next(error);
        }
    }

    async getAppointmentById(req, res, next) {
        try {
            const { id } = req.validatedRequest.params;
            const appointment = await this.appointmentsService.getAppointmentById(id);

            return res.status(200).json(appointment);
        } catch (error) {
            next(error);
        }
    }

    async confirmAppointmentById(req, res, next) {
        try {
            const { id } = req.validatedRequest.params;
            const message = await this.appointmentsService.confirmAppointment(id);

            return res.status(200).json(message);
        } catch (error) {
            next(error);
        }
    }

    async deleteAppointmentById(req, res, next) {
        try {
            const { id } = req.validatedRequest.params;
            const message = await this.appointmentsService.cancelAppointment(id);

            return res.status(200).json(message);
        } catch (error) {
            next(error);
        }
    }

    async checkInAppointmentById(req, res, next) {
        try {
            const { id } = req.validatedRequest.params;
            const message = await this.appointmentsService.checkInAppointment(id);

            return res.status(200).json(message);
        } catch (error) {
            next(error);
        }
    }

    async rescheduleAppointmentById(req, res, next) {
        try {
            const { id } = req.validatedRequest.params;
            const data = req.validatedRequest.body;
            const message = await this.appointmentsService.rescheduleAppointment(id, data);

            return res.status(200).json(message);
        } catch (error){
            next(error);
        }
    }

    async startAppointmentById(req, res, next) {
        try {
            const { id } = req.validatedRequest.params;
            const message = await this.appointmentsService.startAppointment(id);

            return res.status(200).json(message);
        } catch (error){
            next(error);
        }
    }

    async finishAppointmentById(req, res, next) {
        try {
            const { id } = req.validatedRequest.params;
            const message = await this.appointmentsService.finishAppointment(id);

            return res.status(200).json(message);
        } catch (error){
            next(error);
        }
    }

    async getAppointmentNotificationsById(req, res, next) {
        try {
            const { id } = req.params;
            const message = await this.appointmentsService.getAppointmentNotificationsById(id);

            return res.status(200).json(message);
        } catch (error){
            next(error);
        }
    }

}

module.exports = { AppointmentsController };