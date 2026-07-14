class MedicsController {
    constructor(medicsService) {
        this.medicsService = medicsService;
    }

    async getMedics(req, res, next) {
        try {
            const query = req.validatedRequest ? req.validatedRequest.query : req.query;
            const medics = this.medicsService.getMedics(query);

            return res.status(200).json(medics);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { MedicsController };
