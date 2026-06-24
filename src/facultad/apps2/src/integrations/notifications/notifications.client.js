const { InternalServerError } = require('@apps2/errors/internal-server.error');

class NotificationsClient {
    constructor(baseUrl, apiKey, notificationsAdapter) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.notificationsAdapter = notificationsAdapter;
    }

    async sendAppointmentNotification(payload, appointmentId, notificationStrategy, requestId) {
        const toUrl = `${this.baseUrl}/api/v1/notifications`;
        let strategy;

        if (notificationStrategy.notify_by === 'email') {
            payload = this.notificationsAdapter.generateEmailNotification(payload, appointmentId, notificationStrategy.notification_type);
        } else if (notificationStrategy.notify_by === 'webhook') {
            payload = this.notificationsAdapter.generateWebhookNotification(payload, appointmentId, notificationStrategy.notification_type);
        }
        console.log(`${requestId} - Sending ${notificationStrategy.notify_by} notification for appointment id ${appointmentId} due to ${notificationStrategy.notification_type}`);

        const startedAt = performance.now();
        const response = await fetch(toUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'x-request-id': requestId
            },
            body: JSON.stringify(payload)
        });

        const durationMs = Math.round(performance.now() - startedAt);

        console.log(`${requestId} - notifier response status ${response.status} in ${durationMs}ms`);
        const success = response.status === 202;
        if (!success) {
            const responseBody = await response.json();
            console.log(`${requestId} - Failed to queue notification. Response body: ${JSON.stringify(responseBody)}`);
        }

        return { success };
    }

    async getNotification(notificationUuid, requestId) {
        const toUrl = `${this.baseUrl}/api/v1/notifications/${notificationUuid}`;

        const startedAt = performance.now();
        const response = await fetch(toUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'x-request-id': requestId
            },
            query: { notificationUuid }
        });
        const durationMs = Math.round(performance.now() - startedAt);
        const data = await response.json();
        console.log(`${requestId} - notifier response status ${response.status} in ${durationMs}ms`);

        const success = response.status === 200;
        if (!success) {
            console.log(`${requestId} - Failed to retrieve notification from notifier. Response body: ${JSON.stringify(data)}`);
        }

        return { success, data };
    }

    async getNotifications(query, requestId) {
        const params = new URLSearchParams(query);

        const toUrl =
            `${this.baseUrl}/api/v1/notifications?${params}`;

        console.log(
            `${requestId} - Retrieving notifications from notifier`
        );

        const response = await fetch(toUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'x-request-id': requestId
            }
        });

        const data = await response.json();

        return {
            success: response.status === 200,
            status: response.status,
            data
        };
    }
    
}

module.exports = { NotificationsClient };