const { 
    buildAppointmentsController, 
    buildAppointmentExpirationJob,
    buildAppointmentReminderJob,
    buildAppointmentAbsenceJob
 } = require('@apps2/bootstrap/appointments.bootstrap');
const { buildSpecialitiesController } = require('@apps2/bootstrap/specialities.bootstrap');
const { buildMedicalCentersController } = require('@apps2/bootstrap/medical-centers.bootstrap');
const { buildNotificationsController } = require('@apps2/bootstrap/notifications.bootstrap');
const { env } = require('@apps2/configs/env.config');

function buildDependencies() {
    const dependencies = {};
    
    if (env.appointmentsEnabled) {
        dependencies.appointmentsController = buildAppointmentsController();
        buildAppointmentExpirationJob().start();
        buildAppointmentReminderJob().start();
        buildAppointmentAbsenceJob().start();
    }

    if (env.specialitiesEnabled) {
        dependencies.specialitiesController = buildSpecialitiesController();
    }

    if (env.medicalCentersEnabled) {
        dependencies.medicalCentersController = buildMedicalCentersController();
    }

    if (env.notificationsEnabled) {
        dependencies.notificationsController = buildNotificationsController();
    }
    
    return dependencies;
}


module.exports = { buildDependencies };