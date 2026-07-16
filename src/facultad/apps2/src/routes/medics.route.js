const { Router } = require('express');

const { validate } = require('@apps2/middlewares/validate.middleware');
const { createMedicSchema } = require('@apps2/schemas/medics/create-medic.schema');
const { getMedicsSchema } = require('@apps2/schemas/medics/get-medics.schema');

function MedicsRouter(medicsController) {
    const router = Router();

    router.get('/',
        validate(getMedicsSchema, 'query'),
        (req, res, next) => medicsController.getMedics(req, res, next)
    );

    router.post('/',
        validate(createMedicSchema, 'body'),
        (req, res, next) => medicsController.createMedic(req, res, next)
    );

    return router;
}

module.exports = { MedicsRouter };
