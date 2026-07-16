require('module-alias/register');
const cors = require('cors');
const express = require('express');
const { errorHandler } = require('@apps2/middlewares/error-handler.middleware');
const { AppointmentsRouter } = require('@apps2/routes/appointments.route');
const { SpecialitiesRouter } = require('@apps2/routes/specialities.route');
const { MedicalCentersRouter } = require('@apps2/routes/medical-centers.route');
const { NotificationsRouter } = require('@apps2/routes/notifications.route');
const { AuthRouter } = require('@apps2/routes/auth.route');
const { MedicsRouter } = require('@apps2/routes/medics.route');

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
    if (dependencies.authController) {
        app.get(
            '/auth/sso',
            (req, res, next) => dependencies.authController.ssoCallback(req, res, next)
        );

        app.use(
            '/api/v1/auth',
            AuthRouter(dependencies.authController)
        );
    }

    const apiMiddlewares = [
        dependencies.apiKeyMiddleware,
        dependencies.authMiddleware,
    ].filter(Boolean);

    if (dependencies.appointmentsController) {
        app.use(
            '/api/v1/appointments',
            ...apiMiddlewares,
            AppointmentsRouter(dependencies.appointmentsController)
        );
    }

    if (dependencies.specialitiesController) {
        app.use(
            '/api/v1/specialities',
            ...apiMiddlewares,
            SpecialitiesRouter(dependencies.specialitiesController)
        );
    }

    if (dependencies.medicalCentersController) {
        app.use(
            '/api/v1/medical-centers',
            ...apiMiddlewares,
            MedicalCentersRouter(dependencies.medicalCentersController)
        );
    }

    if (dependencies.medicsController) {
        app.use(
            '/api/v1/medics',
            ...apiMiddlewares,
            MedicsRouter(dependencies.medicsController)
        );
    }

    if (dependencies.notificationsController) {
        app.use(
            '/api/v1/notifications',
            ...apiMiddlewares,
            NotificationsRouter(dependencies.notificationsController)
        );
    }
}

module.exports = { createApp };
