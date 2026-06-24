const { AppointmentsController } = require('@apps2/controllers/appointments.controller');
const { AppointmentsService } = require('@apps2/services/appointments.service');
const { AppointmentsUtils } = require('@apps2/utils/appointments.utils');
const { mockConfig } = require('@apps2/configs/mock.config');
const { env } = require('@apps2/configs/env.config');
const { buildNotificationsClient } = require('@apps2/bootstrap/notifications.bootstrap');
const { AppointmentExpirationJob } = require('@apps2/jobs/appointment-expiration.job');
const { AppointmentReminderJob } = require('@apps2/jobs/appointment-reminder.job');
const { AppointmentAbsenceJob } = require('@apps2/jobs/appointment-absence.job');

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
function buildAppointmentsService() {
    const dependencies = mockRequiredDependencies();
    
    return new AppointmentsService(
        buildAppointmentsRepository(), 
        new AppointmentsUtils(), 
        buildNotificationsClient(), 
        dependencies.specialitiesService,
        dependencies.medicalCentersService
    );
}

function buildAppointmentsController() {
    const dependencies = mockRequiredDependencies();
    const appointmentsService = new AppointmentsService(
        buildAppointmentsRepository(),
        new AppointmentsUtils(), 
        buildNotificationsClient(),
        dependencies.specialitiesService,
        dependencies.medicalCentersService
    );
    return new AppointmentsController(appointmentsService);
}

function buildAppointmentExpirationJob() {
    const appointmentsService = buildAppointmentsService();

    return new AppointmentExpirationJob(appointmentsService, {
        intervalMs: env.appointmentsExpirationIntervalMs,
    });
}

function buildAppointmentReminderJob() {
    const appointmentsService = buildAppointmentsService();

    return new AppointmentReminderJob(appointmentsService, {
        intervalMs: env.appointmentsReminderIntervalMs,
    });
}

function buildAppointmentAbsenceJob() {
    const appointmentsService = buildAppointmentsService();

    return new AppointmentAbsenceJob(appointmentsService, {
        intervalMs: env.appointmentsAbsenceIntervalMs,
    });
}

function buildAppointmentsRepository() {
    return buildMySqlRepository();
}

function buildMySqlRepository() {
    const { dbPool } = require('@apps2/configs/database.config');
    const { MySqlAppointmentsRepository } = require('@apps2/repositories/appointments.repository');
    return new MySqlAppointmentsRepository(dbPool);
}

module.exports = { 
    buildAppointmentsController,
    buildAppointmentsService,
    buildAppointmentExpirationJob,
    buildAppointmentReminderJob,
    buildAppointmentAbsenceJob
};