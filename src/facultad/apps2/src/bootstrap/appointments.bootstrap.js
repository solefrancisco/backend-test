const { AppointmentsController } = require('@apps2/controllers/appointments.controller');
const { AppointmentsService } = require('@apps2/services/appointments.service');
const { AppointmentsUtils } = require('@apps2/utils/appointments.utils');
const { mockConfig } = require('@apps2/configs/mock.config');
const { env } = require('@apps2/configs/env.config');
const { buildNotificationsClient } = require('@apps2/bootstrap/notifications.bootstrap');
const { AppointmentExpirationJob } = require('@apps2/jobs/appointment-expiration.job');
const { AppointmentReminderJob } = require('@apps2/jobs/appointment-reminder.job');
const { AppointmentAbsenceJob } = require('@apps2/jobs/appointment-absence.job');
const { buildCoreClient } = require('@apps2/bootstrap/core.bootstrap');

// just for mocking purposes, to avoid circular dependencies
function mockRequiredDependencies() {
    if (mockConfig.enabled) {
        console.log('Mocking enabled - building required dependencies for appointments service');
        const { buildSpecialitiesController } = require('@apps2/bootstrap/specialities.bootstrap');
        const { buildMedicalCentersController } = require('@apps2/bootstrap/medical-centers.bootstrap');
        return {
            specialitiesService: buildSpecialitiesController().specialitiesService,
            medicalCentersService: buildMedicalCentersController().medicalCentersService
        };
    } 
    return {};
}
function buildAppointmentsService(coreClient = buildCoreClient()) {
    const dependencies = mockRequiredDependencies();
    
    return new AppointmentsService(
        buildAppointmentsRepository(), 
        new AppointmentsUtils(), 
        buildNotificationsClient(), 
        dependencies.specialitiesService,
        dependencies.medicalCentersService,
        coreClient
    );
}

function buildAppointmentsController(coreClient = buildCoreClient()) {
    const dependencies = mockRequiredDependencies();
    const appointmentsService = new AppointmentsService(
        buildAppointmentsRepository(),
        new AppointmentsUtils(), 
        buildNotificationsClient(),
        dependencies.specialitiesService,
        dependencies.medicalCentersService,
        coreClient
    );
    return new AppointmentsController(appointmentsService);
}

function buildAppointmentExpirationJob(coreClient = buildCoreClient()) {
    const appointmentsService = buildAppointmentsService(coreClient);

    return new AppointmentExpirationJob(appointmentsService, {
        intervalMs: env.appointmentsExpirationIntervalMs,
    });
}

function buildAppointmentReminderJob(coreClient = buildCoreClient()) {
    const appointmentsService = buildAppointmentsService(coreClient);

    return new AppointmentReminderJob(appointmentsService, {
        intervalMs: env.appointmentsReminderIntervalMs,
    });
}

function buildAppointmentAbsenceJob(coreClient = buildCoreClient()) {
    const appointmentsService = buildAppointmentsService(coreClient);

    return new AppointmentAbsenceJob(appointmentsService, {
        intervalMs: env.appointmentsAbsenceIntervalMs,
    });
}

function buildAppointmentsRepository() {
    return buildMySqlRepository();
}

function buildMySqlRepository() {
    const { dbPool, testDbPool } = require('@apps2/configs/database.config');
    const { MySqlAppointmentsRepository } = require('@apps2/repositories/appointments.repository');
    return new MySqlAppointmentsRepository(dbPool, testDbPool);
}

module.exports = { 
    buildAppointmentsController,
    buildAppointmentsService,
    buildAppointmentExpirationJob,
    buildAppointmentReminderJob,
    buildAppointmentAbsenceJob
};
