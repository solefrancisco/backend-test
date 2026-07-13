function buildAppointmentCoreEvents(appointmentId, notificationPayloads, requestId) {
    const events = [];

    for (const notification of notificationPayloads) {
        const eventName = getEventName(notification);

        if (!eventName) {
            continue;
        }

        events.push({
            eventName,
            payload: {
                correlation_id: requestId,
                appointment_id: appointmentId,
                reason: notification.reason,
                metadata: notification.metadata || {},
                occurred_at: new Date().toISOString(),
            },
        });
    }

    return events;
}

function getEventName(notification) {
    const reason = notification.reason || '';

    if (notification.notification_type === 'webhookCheckIn') {
        return 'module1CheckIn';
    }

    if (notification.notification_type === 'webhookHighComplexity' && reason.includes('cancelado')) {
        return 'module5HighComplexityCancelled';
    }

    if (notification.notification_type === 'webhookOperationsRoom' && reason.includes('cancelado')) {
        return 'module6SurgeryCancelled';
    }

    if (notification.notification_type === 'webhookOperationsRoom' && reason.includes('reprogramado')) {
        return 'module6SurgeryRescheduled';
    }

    return null;
}

module.exports = { buildAppointmentCoreEvents };
