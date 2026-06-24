class MedicalCentersController {
    constructor (medicalCentersService) {
        this.medicalCentersService = medicalCentersService;
    }

    async getMedicalCenters (req,res,next) {
        try {
            const query = req.validatedRequest.query;
            const medicalCenters = await this.medicalCentersService.getMedicalCenters(query);

            res.status(200).json(medicalCenters);
        } catch (error) {
            next(error);
        }
    }

    async getMedicalCentersById (req,res,next) {
        try {
            const { id } = req.params;
            const medicalCenter = await this.medicalCentersService.getMedicalCentersById(id);

            res.status(200).json(medicalCenter);
        } catch (error) {
            next(error);
        }
    }

}

module.exports = {MedicalCentersController};