const { 
    buildAppointmentsController, 
    buildAppointmentsService,
    buildAppointmentExpirationJob,
    buildAppointmentReminderJob,
    buildAppointmentAbsenceJob
 } = require('@apps2/bootstrap/appointments.bootstrap');
const { buildSpecialitiesController } = require('@apps2/bootstrap/specialities.bootstrap');
const { buildMedicalCentersController } = require('@apps2/bootstrap/medical-centers.bootstrap');
const { buildMedicsController } = require('@apps2/bootstrap/medics.bootstrap');
const { buildNotificationsClient, buildNotificationsController } = require('@apps2/bootstrap/notifications.bootstrap');
const { buildCoreClient, buildAuthController, buildAuthMiddleware } = require('@apps2/bootstrap/core.bootstrap');
const { env } = require('@apps2/configs/env.config');
const { createApiKeyMiddleware } = require('@apps2/middlewares/api-key.middleware');

function buildDependencies() {
    const dependencies = {};
    const coreClient = buildCoreClient();

    if (coreClient) {
        dependencies.authController = buildAuthController(coreClient);
        dependencies.authMiddleware = buildAuthMiddleware(coreClient);
        dependencies.coreClient = coreClient;
    }

    if (env.inboundApiKeyEnabled) {
        dependencies.apiKeyMiddleware = createApiKeyMiddleware(env.inboundApiKey);
    }
    
    if (env.appointmentsEnabled) {
        dependencies.appointmentsController = buildAppointmentsController(coreClient);
        startAppointmentsRequestsConsumer(coreClient);
        buildAppointmentExpirationJob(coreClient).start();
        buildAppointmentReminderJob(coreClient).start();
        buildAppointmentAbsenceJob(coreClient).start();
    }

    if (env.specialitiesEnabled) {
        dependencies.specialitiesController = buildSpecialitiesController();
    }

    if (env.medicalCentersEnabled) {
        dependencies.medicalCentersController = buildMedicalCentersController();
    }

    dependencies.medicsController = buildMedicsController(coreClient);

    if (env.notificationsEnabled) {
        dependencies.notificationsController = buildNotificationsController();
    }
    
    return dependencies;
}

function startAppointmentsRequestsConsumer(coreClient) {
    if (!coreClient) {
        return;
    }

    const { AppointmentsRequestsConsumer } = require('@apps2/integrations/rabbit/appointments-requests.consumer');
    const { NotificationsService } = require('@apps2/services/notifications.service');
    const appointmentsService = buildAppointmentsService(coreClient);
    const notificationsService = new NotificationsService(buildNotificationsClient());
    const consumer = new AppointmentsRequestsConsumer(appointmentsService, notificationsService, coreClient);

    consumer.start().catch((error) => {
        console.error('Failed to start appointments requests consumer', error);
    });
}

module.exports = { buildDependencies };
