const { Router } = require ('express');

const { validate } = require ('@apps2/middlewares/validate.middleware');
const { getMedicalCentersSchema } = require ('@apps2/schemas/medical-centers/get-medical-centers.schema');
const { getMedicalCenterByIdSchema } = require ('@apps2/schemas/medical-centers/get-medical-center-by-id.schema');

function MedicalCentersRouter (medicalCentersController) {
    const router = Router();

    router.get('/',
        validate (getMedicalCentersSchema, 'query'),
        (req,res,next) => medicalCentersController.getMedicalCenters(req,res,next)
    );

    router.get('/:id',
        validate (getMedicalCenterByIdSchema, 'params'),
        (req,res,next) => medicalCentersController.getMedicalCentersById(req,res,next)
    );

    return router;
}

module.exports = { MedicalCentersRouter };
