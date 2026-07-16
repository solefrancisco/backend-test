const { env } = require('./env.config');

const coreConfig = {
    enabled: env.coreEnabled,
    baseUrl: env.coreBaseUrl,
    ssoTicketUrl: env.coreSsoTicketUrl,
    ssoExchangeUrl: env.coreSsoExchangeUrl,
    jwksUrl: env.coreJwksUrl,
    email: env.coreEmail,
    password: env.corePassword,
    publisherModule: env.corePublisherModule,
    ssoFrontendBaseUrl: env.coreSsoFrontendBaseUrl,
    ssoRedirectFallback: env.coreSsoRedirectFallback,
    ssoLoginRedirect: env.coreSsoLoginRedirect,
    eventTypeIds: {
        module1CheckIn: env.coreEventModule1CheckInId,
        module5HighComplexityCancelled: env.coreEventModule5HighComplexityCancelledId,
        module6SurgeryCancelled: env.coreEventModule6SurgeryCancelledId,
        module6SurgeryRescheduled: env.coreEventModule6SurgeryRescheduledId,
    },
    requestEventTypeIds: {
        appointmentCreateRequested: env.coreEventAppointmentCreateRequestedId,
        appointmentGetRequested: env.coreEventAppointmentGetRequestedId,
        appointmentCancelRequested: env.coreEventAppointmentCancelRequestedId,
        appointmentRescheduleRequested: env.coreEventAppointmentRescheduleRequestedId,
        appointmentStartRequested: env.coreEventAppointmentStartRequestedId,
        appointmentFinishRequested: env.coreEventAppointmentFinishRequestedId,
        notificationGetRequested: env.coreEventNotificationGetRequestedId,
    },
};

module.exports = { coreConfig };
