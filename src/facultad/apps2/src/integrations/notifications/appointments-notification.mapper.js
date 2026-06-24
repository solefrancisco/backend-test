function getFormattedTimestamp(){
    const date = new Date();

    // UTC-3
    date.setHours(date.getHours() - 3);

    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function getDefaultNotificationTemplate(data, appointmentId, notificationTemplate) {
    const notificationData = data.data || data; // Handle both cases where data is nested under 'data' or is the root object

    return {
        notify_by: 'email',
        notification_type: notificationTemplate,
        appointment: {
            id: appointmentId,
            starts_at: notificationData.appointment.starts_at,
            speciality_name: notificationData.appointment.speciality_name,
            medical_center_name: notificationData.appointment.medical_center_name,
        },
        patient: {
            fullname: notificationData.patient.fullname,
            email: notificationData.patient.email,
        },
        medic: {
            fullname: notificationData.medic.fullname,
            email: notificationData.medic.email,
        }
    };
}

function getWebhookNotificationTemplate(data, appointmentId, notificationTemplate) {
    const notificationData = data.data || data;

    return {
        notify_by: 'webhook', // 👈 Pasa la validación z.literal('webhook')
        request: {            // 👈 Abre el objeto obligatorio 'request'
            // Sacamos la URL de destino de las variables de entorno
            url: process.env.OPERATING_ROOM_WEBHOOK_URL || 'https://api.quirofano-externo.com/v1/webhook',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: { // 👈 Metemos los datos del evento adentro del body que viajará al tercero
                notification_type: notificationTemplate,
                appointment: {
                    id: appointmentId,
                    starts_at: notificationData.appointment.starts_at,
                    speciality_name: notificationData.appointment.speciality_name,
                    medical_center_name: notificationData.appointment.medical_center_name,
                },
                patient: {
                    fullname: notificationData.patient.fullname,
                },
                // Si necesitas pasar el motivo de la cancelación que guardamos antes:
                reason: data.reason || 'Cancelación de turno quirúrgico'
            }
        }
    };
}

function generateCreateAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    return notification;
}

function generateRescheduleAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.original_starts_at = data.data.appointment.starts_at;

    return notification
}

function generateCancelAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.cancelled_at = getFormattedTimestamp();

    return notification;
}

function generateConfirmAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.confirmed_at = getFormattedTimestamp();

    return notification;
}

function generateCheckInAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.checked_in_at = getFormattedTimestamp();

    return notification;
}

function generateFinishAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.finished_at = getFormattedTimestamp();

    return notification;
}

function generateExpiredAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.expired_at = getFormattedTimestamp();

    return notification;
}

function generateReminderAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    return notification;
}

function generateAbsentAppointmentNotification(data, appointmentId, notificationTemplate) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    return notification;
}

function generateWebhookNotification(data, appointmentId, notificationTemplate) {
    const notification = getWebhookNotificationTemplate(data, appointmentId, notificationTemplate);
    return notification;
}

module.exports = {
    generateCreateAppointmentNotification,
    generateRescheduleAppointmentNotification,
    generateCancelAppointmentNotification,
    generateConfirmAppointmentNotification,
    generateCheckInAppointmentNotification,
    generateFinishAppointmentNotification,
    generateExpiredAppointmentNotification,
    generateReminderAppointmentNotification,
    generateAbsentAppointmentNotification,
    generateWebhookNotification
};