class SpecialitiesController {
    constructor(specialitiesService) {
        this.specialitiesService = specialitiesService;
    }
    
    async getSpecialities(req, res, next) {
        try {
            const query = req.validatedRequest.query;
            const specialities = await this.specialitiesService.getSpecialities(query);
            
            res.status(200).json(specialities);
        } catch (error) {
            next(error);
        }
    }

    async getSpecialityById(req, res, next) {
        try {
            const { id } = req.params;
            const speciality = await this.specialitiesService.getSpecialityById(id);
            
            return res.status(200).json(speciality);
        } catch (error) {
            next(error);
        }
    }

}

module.exports = { SpecialitiesController };