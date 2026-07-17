const { InternalServerError } = require('@apps2/errors/internal-server.error');

function getWebhookUrl(envName, fallbackUrl) {
    const url = process.env[envName];

    if (url) {
        return url;
    }

    if (fallbackUrl) {
        return fallbackUrl;
    }

    throw new InternalServerError(`Missing ${envName} for webhook notification`);
}

function getFormattedTimestamp(){
    const date = new Date();

    // UTC-3
    date.setHours(date.getHours() - 3);

    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function getDefaultNotificationTemplate(data, appointmentId, notificationTemplate) {
    const notificationItem = Array.isArray(data)
        ? data.find(item => item.notified_by === "email")
        : data;

    const notificationData = notificationItem?.data || notificationItem;
    const appointmentData = notificationData.appointment;

    return {
        notify_by: 'email',
        notification_type: notificationTemplate,
        appointment: {
            id: appointmentId,
            starts_at: appointmentData.starts_at,
            speciality_name: appointmentData.speciality_name || `Especialidad ${appointmentData.speciality_id}`,
            medical_center_name: appointmentData.medical_center_name || `Centro medico ${appointmentData.center_id}`,
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

function getDefaultWebhookNotificationTemplate(data, appointmentId, notificationTemplate, url, reason, requestId) {
    console.log(`${requestId} - Webhook notification target URL:`, url);
    return {
        notify_by: 'webhook',
        request: {
            url: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                reason: reason
            }
        }
    };
}

function generateCreateAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    return notification;
}

function generateRescheduleAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    const notificationItem = Array.isArray(data)
        ? data.find(item => item.notified_by === "email")
        : data;
    
    const notificationOriginalData = notificationItem?.data || notificationItem;
    
    notification.appointment.original_starts_at = metadata.previous_starts_at;
    notification.appointment.starts_at = metadata.new_starts_at;

    return notification
}

function generateCancelAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.cancelled_at = getFormattedTimestamp();

    return notification;
}

function generateConfirmAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.confirmed_at = getFormattedTimestamp();

    return notification;
}

function generateCheckInAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.checked_in_at = getFormattedTimestamp();

    return notification;
}

function generateFinishAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.finished_at = getFormattedTimestamp();

    return notification;
}

function generateExpiredAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    notification.appointment.expired_at = getFormattedTimestamp();

    return notification;
}

function generateReminderAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    return notification;
}

function generateAbsentAppointmentNotification(data, appointmentId, notificationTemplate, metadata) {
    const notification = getDefaultNotificationTemplate(data, appointmentId, notificationTemplate);
    return notification;
}

function generateOperationsRoomWebhookNotification(data, appointmentId, notificationTemplate, reason, metadata, requestId) {
    const url = getWebhookUrl('OPERATING_ROOM_WEBHOOK_URL', `https://modulo-6-api.hf.space/api/v1/turnos/${appointmentId}/cancelacion`);
    // const notificationOriginalData = data.data;
    
    const notificationItem = Array.isArray(data)
        ? data.find(item => item.notified_by === "email")
        : data;

    const notificationOriginalData = notificationItem?.data || notificationItem;
    
    const notification = getDefaultWebhookNotificationTemplate(notificationOriginalData, appointmentId, notificationTemplate, url, reason, requestId);
    
    notification.request.body = {
        motivo: reason,
        tipo_notificacion: reason,
        timestamp: getFormattedTimestamp(),
    }
    
    delete notification.request.reason;
    
    if (reason.includes('reprogramado')) {
        notification.request.body.previous_starts_at = metadata.previous_starts_at;
        notification.request.body.previous_ends_at = metadata.previous_ends_at;
        notification.request.body.new_starts_at = metadata.new_starts_at;
        notification.request.body.new_ends_at = metadata.new_ends_at;
    }

    return notification;
}

function generateHighComplexityWebhookNotification(data, appointmentId, notificationTemplate, reason, metadata, requestId) {
    const url = getWebhookUrl('HIGH_COMPLEXITY_WEBHOOK_URL', 'https://health-grid-backend-7l67.onrender.com/api/events/webhook');
    // const notificationOriginalData = data.data;
    
    const notificationItem = Array.isArray(data)
        ? data.find(item => item.notified_by === "email")
        : data;

    const notificationOriginalData = notificationItem?.data || notificationItem;
    const notification = getDefaultWebhookNotificationTemplate(data, appointmentId, notificationTemplate, url, reason, requestId);

    notification.request.body.appointment = {
        id: appointmentId,
    }

    if (reason.includes('reprogramado')) {
        notification.request.body.appointment.previous_starts_at = metadata.previous_starts_at;
        notification.request.body.appointment.previous_ends_at = metadata.previous_ends_at;
        notification.request.body.appointment.new_starts_at = metadata.new_starts_at;
        notification.request.body.appointment.new_ends_at = metadata.new_ends_at;
    }

    return notification;
}

function generateCheckInWebhookNotification(data, appointmentId, notificationTemplate, reason, metadata, requestId) {
    const url = getWebhookUrl('CHECK_IN_WEBHOOK_URL', 'https://healthgrid-hce-backend.onrender.com/api/v1/webhook/turnos/presentismo');
    // const notificationOriginalData = data.data;
    
    const notificationItem = Array.isArray(data)
        ? data.find(item => item.notified_by === "email")
        : data;

    const notificationOriginalData = notificationItem?.data || notificationItem;
    const notification = getDefaultWebhookNotificationTemplate(data, appointmentId, notificationTemplate, url, reason, requestId);

    notification.request.body.appointment = {
        id: appointmentId,
        starts_at: notificationOriginalData.appointment.starts_at,
        checked_in_at: getFormattedTimestamp(),
    }

    notification.request.body.patient = {
        id: metadata.patient_id,
    };

    notification.request.body.medic = {
        id: metadata.medic_id,
    };
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
    generateOperationsRoomWebhookNotification,
    generateHighComplexityWebhookNotification,
    generateCheckInWebhookNotification
};
