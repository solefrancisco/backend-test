require('module-alias/register');
const cors = require('cors');
const express = require('express');
const { errorHandler } = require('@notify/middlewares/error-handler.middleware');
const { NotificationRouter } = require('@notify/routes/notification.route');

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
    if (dependencies.notificationController) {
        app.use(
            '/api/v1/notifications', 
            NotificationRouter(dependencies.notificationController)
        );
    }
}

module.exports = { createApp };