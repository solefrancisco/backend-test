const { Router } = require('express');

const { validate } = require('@apps2/middlewares/validate.middleware');
const { getSpecialitiesSchema } = require('@apps2/schemas/specialities/get-specialities.schema');
const { getSpecialityByIdSchema } = require('@apps2/schemas/specialities/get-speciality-by-id.schema');

function SpecialitiesRouter(specialitiesController) {
    const router = Router();

    router.get('/', 
        validate(getSpecialitiesSchema, 'query'),
        (req, res, next) => specialitiesController.getSpecialities(req, res, next)
    );

    router.get('/:id', 
        validate(getSpecialityByIdSchema, 'params'),
        (req, res, next) => specialitiesController.getSpecialityById(req, res, next)
    );

    return router;
}

module.exports = { SpecialitiesRouter };