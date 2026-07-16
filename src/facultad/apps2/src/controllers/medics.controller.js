class MedicsController {
    constructor(medicsService) {
        this.medicsService = medicsService;
    }

    async getMedics(req, res, next) {
        try {
            const query = req.validatedRequest ? req.validatedRequest.query : req.query;
            const medics = await this.medicsService.getMedics(query);

            return res.status(200).json(medics);
        } catch (error) {
            next(error);
        }
    }

    async createMedic(req, res, next) {
        try {
            const body = req.validatedRequest ? req.validatedRequest.body : req.body;
            const medics = await this.medicsService.createMedic(body);

            return res.status(201).json(medics);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { MedicsController };
