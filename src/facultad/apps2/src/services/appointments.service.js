const crypto = require('crypto');

const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { NotFoundError } = require('@apps2/errors/not-found.error');
const { InternalServerError } = require('@apps2/errors/internal-server.error');
const { ConflictError } = require('@apps2/errors/conflict.error');
const { paginationConfig } = require('@apps2/configs/pagination.config');
const { mockConfig } = require('@apps2/configs/mock.config');
const { coreConfig } = require('@apps2/configs/core.config');
const { buildAppointmentCoreEvents } = require('@apps2/integrations/core/appointments-core-events.adapter');

class AppointmentsService {
    constructor(appointmentsRepository, appointmentsUtils, notificationsClient, specialitiesService, medicalCentersService, coreClient = null) {
        this.appointmentsRepository = appointmentsRepository;
        this.appointmentsUtils = appointmentsUtils;
        this.notificationsClient = notificationsClient;
        this.coreClient = coreClient;

        // just for mocking purposes, to avoid circular dependencies
        this.specialitiesService = specialitiesService;
        this.medicalCentersService = medicalCentersService;
    }

    async createAppointment(data) {
        if(mockConfig.enabled) {
            // if mocking is enabled, we check in our database to avoid creating appointments with non existing data
            await this.specialitiesService.getSpecialityById(data.appointment.speciality_id);
            await this.medicalCentersService.getMedicalCentersById(data.appointment.center_id);
        } else {
            await this.validateCoreUserRole(data.patient.id, ['patient', 'pacient', 'paciente'], 'patient');
            await this.validateCoreUserRole(data.medic.id, ['medic', 'medico'], 'medic');
            const speciality = await this.getCoreSpecialityForAppointment(data.appointment.speciality_id);
            data.appointment.speciality_name = speciality.name;
        }

        const result = await this.appointmentsRepository.create(data);
        if (!result.success){
            if (['45400', '45410', '45420', '45430'].includes(result.sqlState))
                throw new ConflictError('Scheduling conflict: ' + result.errorMessage);

            throw new InternalServerError('Failed to create appointment: ' + result.errorMessage);
        }

        
        let notificationPayload = data;
        if (mockConfig.enabled) {
            const adaptedData = { data: [data] }; // adapt to mockData format
            notificationPayload = await this.mockData(adaptedData, { mockUsers: false, mockSpecialities: true, mockMedicalCenter: true, fromGet: false });
            notificationPayload = notificationPayload.data[0]; // extract the appointment data
        }

        const appointmentId = result.data;
        const emailNotification = {
            notify_by: 'email',
            notification_type: 'createAppointment',
        }

        const queued = await this.queueNotificationForAppointment(appointmentId, notificationPayload, emailNotification);
        if (!queued.success) {
            console.error(`Error occurred while queuing notification for appointment id ${appointmentId}: ${queued.errorMessage}`);
            const deleteAppointmentNotification = await this.appointmentsRepository.deleteSavedNotification(appointmentId);

            if (!deleteAppointmentNotification.success)
                throw new InternalServerError('Fail during rollback when trying to delete saved notification for appointment id ' + appointmentId + ': ' + deleteAppointmentNotification.errorMessage);
            
            const deleteAppointment = await this.appointmentsRepository.delete(appointmentId);
            const thrownErrorMessage = !deleteAppointment.success ?
                'Failed to rollback appointment creation for appointment id ' + appointmentId + ': ' + deleteAppointment.errorMessage
                :
                'Rolled back appointment creation for appointment id ' + appointmentId + " due to it was not possible to send the notification";

            throw new InternalServerError(thrownErrorMessage);
        } 

        const notificationId = queued.requestId;
        return { appointment_id: appointmentId, notification_id: notificationId };
    } 

    async getCoreSpecialityForAppointment(specialityId) {
        if (!this.coreClient) {
            throw new InternalServerError('Core client is required to retrieve speciality data when mocked data is disabled');
        }

        const response = await this.coreClient.getSpecialityById(specialityId);
        if (!response.success) {
            if (response.status === 404) {
                throw new BadRequestError(`speciality_id ${specialityId} was not found in Core`);
            }

            throw new InternalServerError(`Failed to retrieve speciality ${specialityId} from Core. Status: ${response.status}`);
        }

        const speciality = this.normalizeCoreSpeciality(response.data);
        if (!speciality || !speciality.name) {
            throw new InternalServerError(`Core speciality ${specialityId} response does not include a name`);
        }

        return speciality;
    }

    async validateCoreUserRole(userId, acceptedRoles, fieldName) {
        if (!this.coreClient) {
            throw new InternalServerError('Core client is required to retrieve user data when mocked data is disabled');
        }

        const response = await this.coreClient.getUserById(userId);
        if (!response.success) {
            throw new BadRequestError(`${fieldName}.id ${userId} does not exist in Core`);
        }

        const user = this.normalizeCoreUser(response.data);
        const roles = this.getCoreUserRoles(user);
        const hasRequiredRole = roles.some(role => acceptedRoles.includes(this.normalizeRoleName(role)));

        if (!hasRequiredRole) {
            throw new BadRequestError(`${fieldName}.id ${userId} does not have a valid ${fieldName} role`);
        }
    }

    normalizeCoreUser(data) {
        return data?.data?.user || data?.data || data?.user || data;
    }

    getCoreUserRoles(user) {
        const roles = user?.roles || user?.role || [];
        const normalizedRoles = Array.isArray(roles) ? roles : [roles];

        return normalizedRoles
            .map(role => {
                if (typeof role === 'string') {
                    return role;
                }

                return role?.name || role?.role_name || role?.description || '';
            })
            .filter(Boolean);
    }

    normalizeRoleName(role) {
        return role
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z]/g, '');
    }

    normalizeCoreSpeciality(data) {
        return data?.data?.speciality || data?.data || data?.speciality || data;
    }

    async findOccupiedAppointments(query) {
        const result = await this.appointmentsRepository.findOccupiedAppointments(query);
        if (!result.success)
            throw new InternalServerError('Failed to retrieve occupied appointments: ' + result.errorMessage);
    
        return {
            appointments: result.data,
        }
    }

    async getAppointments(query) {
        const quantity = await this.appointmentsRepository.count(query);
        if (!quantity.success)
            throw new InternalServerError('Failed to paginate appointments: ' + quantity.errorMessage);

        const totalItems = quantity.data;
        if (totalItems === 0)
            throw new NotFoundError('No appointments found for the given criteria');

        const defaultPageSize = paginationConfig.defaultPageSize;
        const totalPages = Math.ceil(totalItems / defaultPageSize);
        if (query.page > totalPages)
            throw new BadRequestError(`Page ${query.page} does not exist. Total pages: ${totalPages}`);

        let result = await this.appointmentsRepository.findAll(defaultPageSize, query);
        if (!result.success)
            throw new InternalServerError('Failed to retrieve appointments: ' + result.errorMessage);

        if (mockConfig.enabled) {
            result = await this.mockData(result);
        }

        return {
            appointments: result.data,
            pagination: {
                total_appointments: totalItems,
                total_pages: totalPages,
                appointments_per_page: defaultPageSize
            }
        };
    }

    async getAppointmentById(id) {
        let response = await this.appointmentsRepository.findById(id);
        
        if (!response.success)
            throw new InternalServerError('Failed to find appointment: ' + response.errorMessage);

        if (!response.data)
            throw new NotFoundError(`Appointment id ${id} not found`);
        
        if (mockConfig.enabled) {
            const result = { data: [response.data] }; // adapt to mockData format
            response = await this.mockData(result);
            return response.data[0]; // extract the appointment data
        }

        return response.data;
    }

    async confirmAppointment(id) {
        const perform = {
            action: 'confirmAppointment',
            output: "confirmed",
            repositoryFunction: (id) => this.appointmentsRepository.confirm(id),
        };

        return await this.updateAppointmentStatusAndNotify(id, perform);
    }

    async checkInAppointment(id) {
        const perform = {
            action: 'checkInAppointment',
            output: "checked-in",
            repositoryFunction: (id) => this.appointmentsRepository.checkIn(id),
        };

        const appointmentInformation = await this.getAppointmentById(id);
        const actualStatus = appointmentInformation.status;

        const maxHoursBeforeAppointment = 1;
        const appointmentStartsAt = new Date(appointmentInformation.starts_at.replace(' ', 'T') + '-03:00');
        const earliestAllowedCheckIn = new Date(appointmentStartsAt.getTime() - maxHoursBeforeAppointment * 60 * 60 * 1000);

        /*
        if(new Date() < earliestAllowedCheckIn)
            throw new BadRequestError('Cannot check-in more than 1 hour before the scheduled time');
        */
       
        let webhookPayload = await this.checkIfWebhookRequired(id, this.getAppointmentSpeciality(appointmentInformation), "check-in", {
            patient_id: this.getAppointmentPatientId(appointmentInformation),
            medic_id: this.getAppointmentMedicId(appointmentInformation)
        });
        return await this.updateAppointmentStatusAndNotify(id, perform, null, actualStatus, webhookPayload);
    }

    async checkIfWebhookRequired(appointmentId, appointmentSpeciality, reason, metadata = {}){
        let webhookPayload = [];

        if (mockConfig.enabled) {
            return webhookPayload;
        }

        if (reason === "check-in") {
            webhookPayload.push({
                notify_by: 'webhook',
                notification_type: 'webhookCheckIn',
                appointmentId: appointmentId,
                metadata: metadata,
                reason: 'El paciente hizo checkin',
            });

            return webhookPayload;
        }

        if (["cancelado", "reprogramado", "expirado", "ausente"].includes(reason)) {
            const speciality = await this.getWebhookSpeciality(appointmentSpeciality);

            if (!speciality) {
                return webhookPayload;
            }

            const isSurgery = speciality.type === "SURGERY";
            const isHighComplexity = speciality.is_high_complexity;
            const finalReason = reason === "ausente" ? "no se llevo a cabo porque el paciente no asistió" : reason;

            if (isSurgery) {
                webhookPayload.push({
                    notify_by: 'webhook',
                    notification_type: 'webhookOperationsRoom',
                    appointmentId: appointmentId,
                    metadata: metadata,
                    reason: 'Turno quirúrgico ' + finalReason,
                });
            }
            
            if (isHighComplexity) {
                webhookPayload.push({
                    notify_by: 'webhook',
                    notification_type: 'webhookHighComplexity',
                    appointmentId: appointmentId,
                    metadata: metadata,
                    reason: 'Turno de alta complejidad ' + finalReason,
                });
            }
        }

        return webhookPayload;
    }

    async getWebhookSpeciality(appointmentSpeciality) {
        if (!appointmentSpeciality) {
            return null;
        }

        if (typeof appointmentSpeciality === 'object') {
            return appointmentSpeciality;
        }

        if (!this.specialitiesService) {
            return null;
        }

        return await this.specialitiesService.getSpecialityById(appointmentSpeciality);
    }

    getAppointmentSpeciality(appointment) {
        return appointment.speciality ?? appointment.speciality_id;
    }

    getAppointmentPatientId(appointment) {
        return appointment.patient?.id ?? appointment.patient_id;
    }

    getAppointmentMedicId(appointment) {
        return appointment.medic?.id ?? appointment.medic_id;
    }

    getAppointmentCenterId(appointment) {
        return appointment.medical_center?.id ?? appointment.center_id;
    }

    async cancelAppointment(id) {
        const appointment = await this.getAppointmentById(id);
        const actualStatus = appointment.status;

        const perform = {
            action: 'cancelAppointment',
            output: 'cancelled',
            repositoryFunction: (id) => this.appointmentsRepository.cancel(id),
        };

        let webhookPayload = await this.checkIfWebhookRequired(id, this.getAppointmentSpeciality(appointment), "cancelado");
        return await this.updateAppointmentStatusAndNotify(id, perform, null, actualStatus, webhookPayload);
    }

    async rescheduleAppointment(id, data) {
        const perform = {
            action: 'rescheduleAppointment',
            output: "rescheduled",
            repositoryFunction: (id, data) => this.appointmentsRepository.reschedule(id, data),
        };

        const appointmentInformation = await this.getAppointmentById(id);
        const actualStatus = appointmentInformation.status;
        const actualStartsAt = appointmentInformation.starts_at;
        const actualEndsAt = appointmentInformation.ends_at;
        
        if (actualStartsAt === data.starts_at)
            throw new BadRequestError('The new start time must be different from the current one');

        if (actualEndsAt === data.ends_at)
            throw new BadRequestError('The new end time must be different from the current one');

        const centerId = this.getAppointmentCenterId(appointmentInformation);
        const medicId = this.getAppointmentMedicId(appointmentInformation);
        const patientId = this.getAppointmentPatientId(appointmentInformation);

        const checkData = {
            center_id: centerId,
            medic_id: medicId,
            patient_id: patientId,
            since: data.starts_at,
            until: data.ends_at
        }

        const checkAvailabilityResult = await this.appointmentsRepository.checkAvailability(checkData);
        if (!checkAvailabilityResult.success){
            throw new InternalServerError('Failed to check availability for rescheduling: ' + checkAvailabilityResult.errorMessage);
        }
        
        if (checkAvailabilityResult.data){
            throw new ConflictError('The request conflicts with an existing appointment (ID: ' + checkAvailabilityResult.data.id + ')');
        }

        const metadata = {
            previous_starts_at: actualStartsAt,
            previous_ends_at: actualEndsAt,
            new_starts_at: data.starts_at,
            new_ends_at: data.ends_at
        }

        let webhookPayload = await this.checkIfWebhookRequired(id, this.getAppointmentSpeciality(appointmentInformation), "reprogramado", metadata);
        return await this.updateAppointmentStatusAndNotify(id, perform, data, actualStatus, webhookPayload);
    }

    async startAppointment(id) {
        const perform = {
            action: 'startAppointment',
            output: "started",
            repositoryFunction: (id) => this.appointmentsRepository.start(id),
        };

        const appointmentInformation = await this.getAppointmentById(id);
        const actualStatus = appointmentInformation.status;
        return await this.updateAppointmentStatus(id, perform, actualStatus);
    }

    async finishAppointment(id) {
        const perform = {
            action: 'finishAppointment',
            output: "finished",
            repositoryFunction: (id) => this.appointmentsRepository.complete(id),
        };

        const appointmentInformation = await this.getAppointmentById(id);
        const actualStatus = appointmentInformation.status;

        return await this.updateAppointmentStatusAndNotify(id, perform, actualStatus);
    }

    async expirePendingAppointments() {
        const appointmentsToExpire = await this.appointmentsRepository.findPendingAppointmentsToExpire();
        if (!appointmentsToExpire.success)
            throw new InternalServerError('Failed to retrieve pending appointments to expire: ' + appointmentsToExpire.errorMessage);
        
        const totalToExpire = appointmentsToExpire.data.length;
        if (totalToExpire === 0)
            return { message: 'No pending appointments to expire' };
        
        for (const appointment of appointmentsToExpire.data) {
            const id = appointment.id;
            const perform = {
                action: 'expiredAppointment',
                output: "expired",
                repositoryFunction: (id) => this.appointmentsRepository.expirePendingAppointment(id),
            };

            try{
                let webhookPayload = await this.checkIfWebhookRequired(id, this.getAppointmentSpeciality(appointment), "expirado");
                await this.updateAppointmentStatusAndNotify(id, perform, null, null, webhookPayload);
            } catch (error) {
                continue; // continue with the next appointment, we don't want one failure to stop the whole expiration process
            }
        }

        return { message: `Expired ${totalToExpire} pending appointments` };
    }

    async remindPendingAppointments() {
        const appointmentsToRemind = await this.appointmentsRepository.findPendingAppointmentsToRemind();
        if (!appointmentsToRemind.success)
            throw new InternalServerError('Failed to retrieve pending appointments to remind: ' + appointmentsToRemind.errorMessage);
    
        const totalToRemind = appointmentsToRemind.data.length;
        if (totalToRemind === 0)
            return { message: 'No pending appointments to remind' };
    
        for (const appointment of appointmentsToRemind.data) {
            const id = appointment.id;
            const perform = {
                action: 'remindAppointment',
                output: "reminded",
                repositoryFunction: (id) => this.appointmentsRepository.remindPendingAppointment(id),
            };

            try{
                await this.updateAppointmentStatusAndNotify(id, perform);
            } catch (error) {
                continue; // continue with the next appointment, we don't want one failure to stop the whole expiration process
            }
        }

        return { message: `Reminded ${totalToRemind} pending appointments` };
    }

    async setAppointmentsAsAbsent() {
        const appointmentsToSetAsAbsent = await this.appointmentsRepository.findAppointmentsToSetAsAbsent();
        if (!appointmentsToSetAsAbsent.success)
            throw new InternalServerError('Failed to retrieve confirmed appointments to set as absent: ' + appointmentsToSetAsAbsent.errorMessage);

        const totalToSetAsAbsent = appointmentsToSetAsAbsent.data.length;
        if (totalToSetAsAbsent === 0)
            return { message: 'No confirmed appointments to set as absent' };
        
        for (const appointment of appointmentsToSetAsAbsent.data) {
            const id = appointment.id;
            const perform = {
                action: 'absentAppointment',
                output: "absent",
                repositoryFunction: (id) => this.appointmentsRepository.setAppointmentAsAbsent(id),
            };

            try{
                let webhookPayload = await this.checkIfWebhookRequired(id, this.getAppointmentSpeciality(appointment), "ausente");
                await this.updateAppointmentStatusAndNotify(id, perform, null, null, webhookPayload);
            } catch (error) {
                continue; // continue with the next appointment, we don't want one failure to stop the whole expiration process
            }
        }

        return { message: `Set as absent ${totalToSetAsAbsent} confirmed appointments` };
    }
    async getAppointmentStatus(id) {
        const appointmentInformation = await this.getAppointmentById(id);
        const originalStatus = appointmentInformation.status;
        return originalStatus;
    }

    async updateAppointmentStatus(id, perform, originalStatus, data = null){
        let result;
        if (data){
            result = await perform.repositoryFunction(id, data);        
        } else {
            result = await perform.repositoryFunction(id);
        }

        if (!result.success)
            throw new InternalServerError ('Failed to perform operation on appointment: ' + result.sqlState);
        
        if (!result.data.affectedRows)
            throw new BadRequestError(`Appointment id ${id} was not found or status change was not allowed from ${originalStatus}`);

        return { message: `Appointment ${perform.output} successfully` };
    }

    async updateAppointmentStatusAndNotify(id, perform, data = null, originalStatus = null, webhookPayload = []) {
        const rollbackStatus = originalStatus ?? await this.getAppointmentStatus(id);
        await this.updateAppointmentStatus(id, perform, rollbackStatus, data);

        const queued = await this.sendChangeStatusNotification(id, perform.action, webhookPayload);
        if (!queued.success) {
            const rollbackResult = await this.appointmentsRepository.rollbackStatusChange(id, rollbackStatus);

            if (!rollbackResult.success) {
                throw new InternalServerError(
                    `Failed to perform operation on appointment and failed to rollback (${rollbackStatus}). Manual intervention required for appointment id ${id}.`
                );
            }

            throw new InternalServerError('Failed to queue appointment change notifications');
        }

        return {
            message: `Appointment ${perform.output} successfully`,
            notification_id: queued.requestId
        };
    }
    
    async sendChangeStatusNotification(id, action, webhookPayload = []) {
        const requestId = crypto.randomUUID();
        const originalNotificationData = await this.getNotificationOriginalData(id, requestId);
        const notificationsToQueue = [
            {
                notify_by: 'email',
                notification_type: action,
            }
        ];

        if (webhookPayload.length > 0) {
            notificationsToQueue.push(...webhookPayload);
            notificationsToQueue[0].metadata = webhookPayload[0].metadata
        }

        try {
            await this.publishCoreWebhookEvents(id, webhookPayload, requestId);
            const queuePromises = notificationsToQueue.map(notification => this.queueNotificationForAppointment(id, originalNotificationData, notification, requestId));
            const results = await Promise.all(queuePromises);
            return { success: true, requestId };
        } catch (error) {
            console.error(`Failed to queue notifications for appointment id ${id}:`, error);
            // Atajamos cualquier error de infraestructura inesperado
            return { success: false, requestId };
        }
    }

    async publishCoreWebhookEvents(appointmentId, webhookPayload, requestId) {
        if (mockConfig.enabled || !this.coreClient || webhookPayload.length === 0) {
            return;
        }

        const events = buildAppointmentCoreEvents(appointmentId, webhookPayload, requestId);

        for (const event of events) {
            const eventTypeId = coreConfig.eventTypeIds[event.eventName];
            const result = await this.coreClient.publishEvent(eventTypeId, event.payload, requestId);

            if (!result.success) {
                throw new InternalServerError(`Failed to publish Core event ${event.eventName}. Status: ${result.status}`);
            }
        }
    }

    async getNotificationOriginalData(appointmentId, requestId) {
        const getNotificationOriginalUuid = await this.appointmentsRepository.getNotificationUuid(appointmentId);
        if (!getNotificationOriginalUuid.success)
            throw new InternalServerError('Failed to retrieve original contact data for appointment id ' + appointmentId + ': ' + getNotificationOriginalUuid.errorMessage);
        
        if (!getNotificationOriginalUuid.data)
            // it's internal server error because this data should exist if we are trying to send a notification for an appointment, if it doesn't exist something went wrong in the appointment creation process
            throw new InternalServerError('No original contact data found for appointment id ' + appointmentId);
        
        const checkNotificationUuid = getNotificationOriginalUuid.data.notification_uuid;

        console.log(`${requestId} - Retrieving notification ${checkNotificationUuid} related to appointment id ${appointmentId} from notifier`);
        const notificationData = await this.notificationsClient.getNotificationById(checkNotificationUuid, requestId);
        if (!notificationData.success)
            throw new InternalServerError('Failed to retrieve original contact data from notification service for appointment id ' + appointmentId);
        
        return notificationData.data;
    }

    async queueNotificationForAppointment(appointmentId, notificationPayload, Notification, notificationUuid = crypto.randomUUID()) {
        const savedNotification = await this.appointmentsRepository.saveNotification(appointmentId, notificationUuid, Notification.notification_type);
        if (!savedNotification.success){
            console.error('Failed to save notification for appointment id ' + appointmentId + ': ' + savedNotification.errorMessage);
            return { success: false, errorMessage: savedNotification.errorMessage };
        }
        
        const queued = await this.notificationsClient.sendAppointmentNotification(notificationPayload, appointmentId, Notification, notificationUuid);
        if (!queued.success){
            console.error('Failed to queue notification for appointment id ' + appointmentId);
            return { success: false, errorMessage: queued.errorMessage };
        }

        return { success: true, requestId: notificationUuid };
    }

    async searchAppointments(query) {
        if (query.light_response)
            return await this.findOccupiedAppointments(query);

        return await this.getAppointments(query);
    }

    async mockData(result, {mockUsers=true, mockSpecialities=true, mockMedicalCenter=true, fromGet=true} = {}) {
        let mockedUsers;

        if (mockUsers) {
            mockedUsers = await this.appointmentsRepository.findMockedUsers();
            if (!mockedUsers.success)
                throw new InternalServerError('Failed to retrieve mocked users: ' + mockedUsers.errorMessage);
        }
        
        for (const appointment of result.data) {
            if(mockUsers) {
                const randomPatient = this.appointmentsUtils.getRandomItem(mockedUsers.data);
                const randomMedic = this.appointmentsUtils.getRandomItem(mockedUsers.data);
                
                appointment.patient = {
                    id: appointment.patient_id,
                    fullname: randomPatient.fullname,
                    email: randomPatient.email
                };
                appointment.medic = {
                    id: appointment.medic_id,
                    fullname: randomMedic.fullname,
                    email: randomMedic.email
                };

                delete appointment.medic_id;
                delete appointment.patient_id;
            }
            
            const currentAppointmentData = (fromGet) ? appointment : appointment.appointment;
            if(mockSpecialities) {
                const specialityId = currentAppointmentData.speciality_id;
                const specialityResponse = await this.specialitiesService.getSpecialityById(specialityId);

                if (fromGet) {
                    appointment.speciality = specialityResponse;
                } else {
                    appointment.appointment.speciality_name = specialityResponse.name;
                }

                delete appointment.speciality_id;
            }

            if(mockMedicalCenter) {
                const medicalCenterId = currentAppointmentData.center_id;
                const medicalCenterResponse = await this.medicalCentersService.getMedicalCentersById(medicalCenterId);

                if (fromGet) {
                    appointment.medical_center = medicalCenterResponse;
                } else {
                    appointment.appointment.medical_center_name = medicalCenterResponse.name;
                }

                delete appointment.center_id;
            }
        }

        return result;
    }

    async getAppointmentNotificationsById(appointmentId) {
        await this.getAppointmentById(appointmentId);

        const getNotifications = await this.appointmentsRepository.getAppointmentNotificationsById(appointmentId);
        if (!getNotifications.success)
            throw new InternalServerError(`Failed to retrieve notifications for this appointment. Error: ${getNotifications.errorMessage}`);
        
        if (!getNotifications.data)
            throw new InternalServerError(`No notifications found for appointment ID ${appointmentId}`);

        const grouped = Object.values(
            getNotifications.data.reduce((acc, notification) => {
                const { notification_uuid, reason, created_at } = notification;

                if (!acc[notification_uuid]) {
                    acc[notification_uuid] = {
                        notification_uuid,
                        event: null,
                        notifications: []
                    };
                }

                if (reason.startsWith('webhook')) {
                    acc[notification_uuid].notifications.push({
                        to: reason,
                        created_at
                    });
                } else {
                    acc[notification_uuid].event = reason;
                    acc[notification_uuid].notifications.push({
                        to: 'email',
                        created_at
                    });
                }

                return acc;
            }, {})
        );

        return grouped;
    }
}

module.exports = { AppointmentsService };
