function getFormattedTimestamp(){
    const date = new Date();

    // UTC-3
    date.setHours(date.getHours() - 3);

    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function getDefaultNotificationTemplate(data, appointmentId, notificationTemplate) {
    console.log("getDefaultNotificationTemplate", data)

    const notificationItem = Array.isArray(data)
        ? data.find(item => item.notified_by === "email")
        : data;

    const notificationData = notificationItem?.data || notificationItem;

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

function generateOperationsRoomWebhookNotification(data, appointmentId, notificationTemplate, reason, metadata, requestId) {
    const url = process.env.OPERATING_ROOM_WEBHOOK_URL || 'https://webhook.site/a9b2fece-53f8-4fb0-bf1e-b350a862f99a';
    // const notificationOriginalData = data.data;
    
    const notificationItem = Array.isArray(data)
        ? data.find(item => item.notified_by === "email")
        : data;

    const notificationOriginalData = notificationItem?.data || notificationItem;
    
    const notification = getDefaultWebhookNotificationTemplate(notificationOriginalData, appointmentId, notificationTemplate, url, reason, requestId);
    
    notification.request.body.appointment = {
        id: appointmentId,
        starts_at: notificationOriginalData.appointment.starts_at,
        speciality_name: notificationOriginalData.appointment.speciality_name,
        medical_center_name: notificationOriginalData.appointment.medical_center_name,
    }

    
    if (reason.includes('reprogramado')) {
        notification.request.body.appointment.previous_starts_at = metadata.previous_starts_at;
        notification.request.body.appointment.previous_ends_at = metadata.previous_ends_at;
        notification.request.body.appointment.new_starts_at = metadata.new_starts_at;
        notification.request.body.appointment.new_ends_at = metadata.new_ends_at;
    }

    return notification;
}

function generateHighComplexityWebhookNotification(data, appointmentId, notificationTemplate, reason, metadata, requestId) {
    const url = process.env.HIGH_COMPLEXITY_WEBHOOK_URL || 'https://webhook.site/a9b2fece-53f8-4fb0-bf1e-b350a862f99a';
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
    const url = process.env.CHECK_IN_WEBHOOK_URL || 'https://webhook.site/a9b2fece-53f8-4fb0-bf1e-b350a862f99a';
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
