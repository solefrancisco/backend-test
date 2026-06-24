require('module-alias/register');
const cors = require('cors');
const express = require('express');
const { errorHandler } = require('@apps2/middlewares/error-handler.middleware');
const { AppointmentsRouter } = require('@apps2/routes/appointments.route');
const { SpecialitiesRouter } = require('@apps2/routes/specialities.route');
const { MedicalCentersRouter } = require('@apps2/routes/medical-centers.route');
const { NotificationsRouter } = require('@apps2/routes/notifications.route');

function createApp(dependencies) {
    const app = express();

    app.use(cors());
    app.use(express.json());

    bootstrapAppControllers(app, dependencies);

    app.use((req, res) => {
        return res.status(404).json({
            error: 'Not found',
            message: `Route ${req.method} ${req.originalUrl} not found`
        });
    });

    app.use(errorHandler);

    return app;
}

function bootstrapAppControllers(app, dependencies) {
    if (dependencies.appointmentsController) {
        app.use(
            '/api/v1/appointments', 
            AppointmentsRouter(dependencies.appointmentsController)
        );
    }

    if (dependencies.specialitiesController) {
        app.use(
            '/api/v1/specialities', 
            SpecialitiesRouter(dependencies.specialitiesController)
        );
    }

    if (dependencies.medicalCentersController) {
        app.use(
            '/api/v1/medical-centers',
            MedicalCentersRouter(dependencies.medicalCentersController)
        );
    }

    if (dependencies.notificationsController) {
        app.use(
            '/api/v1/notifications',
            NotificationsRouter(dependencies.notificationsController)
        );
    }
}

module.exports = { createApp };