const { rabbitConfig } = require('@apps2/configs/rabbitmq.config');
const { coreConfig } = require('@apps2/configs/core.config');
const { connectRabbit } = require('@apps2/integrations/rabbit/rabbit.client');
const crypto = require('crypto');

class AppointmentsRequestsConsumer {
    constructor(appointmentsService, notificationsService, coreClient) {
        this.appointmentsService = appointmentsService;
        this.notificationsService = notificationsService;
        this.coreClient = coreClient;
        this.handlers = {
            [coreConfig.requestEventTypeIds.appointmentCreateRequested]: payload => this.createAppointment(payload),
            [coreConfig.requestEventTypeIds.appointmentGetRequested]: payload => this.getAppointment(payload),
            [coreConfig.requestEventTypeIds.appointmentCancelRequested]: payload => this.cancelAppointment(payload),
            [coreConfig.requestEventTypeIds.appointmentRescheduleRequested]: payload => this.rescheduleAppointment(payload),
            [coreConfig.requestEventTypeIds.appointmentStartRequested]: payload => this.startAppointment(payload),
            [coreConfig.requestEventTypeIds.appointmentFinishRequested]: payload => this.finishAppointment(payload),
            [coreConfig.requestEventTypeIds.notificationGetRequested]: payload => this.getNotification(payload),
        };
    }

    async start() {
        if (!rabbitConfig.enabled) {
            return;
        }

        const channel = await connectRabbit();
        await channel.checkQueue(rabbitConfig.queues.appointmentsRequests);
        channel.prefetch(1);

        await channel.consume(rabbitConfig.queues.appointmentsRequests, async (message) => {
            if (!message) {
                return;
            }

            try {
                await this.processMessage(message);
                channel.ack(message);
            } catch (error) {
                console.error(`Failed to process appointments request message: ${error.message} rawLength=${message.content?.length || 0}`);
                channel.nack(message, false, false);
            }
        });

        console.log(`Listening RabbitMQ queue ${rabbitConfig.queues.appointmentsRequests}`);
    }

    async processMessage(message) {
        const event = JSON.parse(message.content.toString());
        const payload = this.parsePayload(event.payload);
        const handler = this.handlers[event.event_type_id];
        const traceId = payload.correlation_id || message.properties?.correlationId || crypto.randomUUID();

        console.log(
            `[${traceId}] Received Core event ${event.event_type_id} ${event.event_type_name || ''} with correlation_id ${payload.correlation_id || 'none'}`
        );
        console.log(`[${traceId}] Core event envelope: ${this.safeStringify(this.getEventEnvelope(event))}`);
        console.log(`[${traceId}] Core event payload: ${this.safeStringify(payload)}`);

        if (!handler) {
            console.error(`[${traceId}] Unsupported Core event received: ${this.safeStringify(this.getEventEnvelope(event))}`);
            await this.publishResponse(payload, {
                status: 'failed',
                error: {
                    code: 'UNSUPPORTED_EVENT',
                    message: `Unsupported event_type_id ${event.event_type_id}`,
                },
            }, traceId);
            return;
        }

        try {
            console.log(`[${traceId}] Dispatching Core event ${event.event_type_id} to appointments handler`);
            const data = await handler(payload);
            console.log(`[${traceId}] Core event ${event.event_type_id} handler result: ${this.safeStringify(data)}`);
            await this.publishResponse(payload, {
                status: 'success',
                data,
                error: null,
            }, traceId);
            console.log(
                `[${traceId}] Processed Core event ${event.event_type_id} with correlation_id ${payload.correlation_id || 'none'}`
            );
        } catch (error) {
            console.error(`[${traceId}] Core event ${event.event_type_id} handler error: ${this.safeStringify(this.getErrorLog(error))}`);
            await this.publishResponse(payload, {
                status: 'failed',
                data: null,
                error: {
                    code: error.name || 'APPOINTMENTS_REQUEST_FAILED',
                    message: error.message,
                },
            }, traceId);
            console.error(
                `[${traceId}] Failed Core event ${event.event_type_id} with correlation_id ${payload.correlation_id || 'none'}: ${error.message}`
            );
        }
    }

    getErrorLog(error) {
        return {
            name: error.name,
            message: error.message,
        };
    }

    getEventEnvelope(event) {
        return {
            event_type_id: event.event_type_id,
            event_type_name: event.event_type_name,
            source_module: event.source_module,
            publisher_module: event.publisher_module,
            log_id: event.log_id,
            published_at: event.published_at,
            payload_raw: event.payload,
        };
    }

    parsePayload(payload) {
        if (!payload) {
            return {};
        }

        if (typeof payload === 'string') {
            return JSON.parse(payload);
        }

        return payload;
    }

    async publishResponse(requestPayload, responsePayload, traceId = requestPayload.correlation_id || 'none') {
        if (!requestPayload.response_event_id) {
            console.log(`[${traceId}] No response_event_id for correlation_id ${requestPayload.correlation_id || 'none'}; skipping Core response`);
            return;
        }

        console.log(`[${traceId}] Publishing Core response payload: ${this.safeStringify({
            event_type_id: requestPayload.response_event_id,
            correlation_id: requestPayload.correlation_id,
            response: responsePayload,
        })}`);
        await this.coreClient.publishEvent(requestPayload.response_event_id, {
            correlation_id: requestPayload.correlation_id,
            ...responsePayload,
        }, requestPayload.correlation_id);
        console.log(
            `[${traceId}] Published Core response_event_id ${requestPayload.response_event_id} for correlation_id ${requestPayload.correlation_id || 'none'}`
        );
    }

    async createAppointment(payload) {
        const data = payload.data || payload.appointment || payload;
        return await this.appointmentsService.createAppointment(data);
    }

    async getAppointment(payload) {
        return await this.appointmentsService.getAppointmentById(this.getAppointmentId(payload));
    }

    async cancelAppointment(payload) {
        return await this.appointmentsService.cancelAppointment(this.getAppointmentId(payload));
    }

    async rescheduleAppointment(payload) {
        const data = payload.data || {
            starts_at: payload.starts_at,
            ends_at: payload.ends_at,
        };

        return await this.appointmentsService.rescheduleAppointment(this.getAppointmentId(payload), data);
    }

    async startAppointment(payload) {
        return await this.appointmentsService.startAppointment(this.getAppointmentId(payload));
    }

    async finishAppointment(payload) {
        return await this.appointmentsService.finishAppointment(this.getAppointmentId(payload));
    }

    async getNotification(payload) {
        if (payload.uuid || payload.notification_uuid) {
            return await this.notificationsService.getNotificationById(payload.uuid || payload.notification_uuid);
        }

        if (payload.appointment_id || payload.id) {
            return await this.appointmentsService.getAppointmentNotificationsById(this.getAppointmentId(payload));
        }

        return await this.notificationsService.getNotifications(payload.query || payload);
    }

    getAppointmentId(payload) {
        return payload.appointment_id || payload.id;
    }

    safeStringify(value) {
        try {
            return JSON.stringify(value);
        } catch (error) {
            return `[unserializable: ${error.message}]`;
        }
    }
}

module.exports = { AppointmentsRequestsConsumer };
