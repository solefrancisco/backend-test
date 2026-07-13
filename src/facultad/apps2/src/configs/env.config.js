const dotenv = require('dotenv');

dotenv.config();

function getRequired(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getBoolean(name) {
  const rawValue = getRequired(name);
  const normalizedValue = rawValue.trim().toLowerCase();

  // required since when using Boolean() on a non-empty string it will always return true, even for "false"
  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  throw new Error(`Environment variable ${name} must be "true" or "false"`);
}

function getNumber(name) {
  const rawValue = getRequired(name);
  const value = Number(rawValue);

  if (isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return value;
}

function getOptional(name) {
  return process.env[name];
}

function getOptionalNumber(name) {
  const rawValue = getOptional(name);

  if (!rawValue) {
    return undefined;
  }

  const value = Number(rawValue);

  if (isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return value;
}

function getOptionalBoolean(name, defaultValue = undefined) {
  const rawValue = getOptional(name);

  if (!rawValue) {
    return defaultValue;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  throw new Error(`Environment variable ${name} must be "true" or "false"`);
}

function getOptionalWithDefault(name, defaultValue) {
  const value = getOptional(name);
  return value || defaultValue;
}

function getFirstOptional(...names) {
  for (const name of names) {
    const value = getOptional(name);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getFirstOptionalNumber(...names) {
  const rawValue = getFirstOptional(...names);

  if (!rawValue) {
    return undefined;
  }

  const value = Number(rawValue);

  if (isNaN(value)) {
    throw new Error(`Environment variable ${names.join(' or ')} must be a valid number`);
  }

  return value;
}

function getRequiredInProduction(name) {
  const environment = getRequired('APPS2_ENVIRONMENT');

  if (environment !== 'production') {
    return getOptional(name);
  }

  return getRequired(name);
}

function getRequiredNumberInProduction(name) {
  const value = getRequiredInProduction(name);

  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return parsedValue;
}

module.exports = {
  env: {
    // APP
    environment: getRequired('APPS2_ENVIRONMENT'), // development, production, test
    port: getNumber('PORT'),

    // DATABASE
    dbEnabled: getBoolean('APPS2_DB_ENABLED'),
    dbHost: getRequired('APPS2_DB_HOST'),
    dbPort: getNumber('APPS2_DB_PORT'),
    dbUser: getRequired('APPS2_DB_USER'),
    dbPassword: getRequired('APPS2_DB_PASSWORD'),
    dbName: getRequired('APPS2_DB_NAME'),
    dbConnectionLimit: getNumber('APPS2_DB_CONNECTION_LIMIT'),
    dbQueueLimit: getNumber('APPS2_DB_QUEUE_LIMIT'),
    dbWaitForConnections: getBoolean('APPS2_DB_WAIT_FOR_CONNECTIONS'),

    // TEST DATABASE MIRROR
    testDbHost: getRequiredInProduction('APPS2_TEST_DB_HOST'),
    testDbPort: getRequiredNumberInProduction('APPS2_TEST_DB_PORT'),
    testDbUser: getRequiredInProduction('APPS2_TEST_DB_USER'),
    testDbPassword: getRequiredInProduction('APPS2_TEST_DB_PASSWORD'),
    testDbName: getRequiredInProduction('APPS2_TEST_DB_NAME'),
    testDbConnectionLimit: getOptionalNumber('APPS2_TEST_DB_CONNECTION_LIMIT'),
    testDbQueueLimit: getOptionalNumber('APPS2_TEST_DB_QUEUE_LIMIT'),

    // PAGINATION
    paginationDefaultPageSize: getNumber('APPS2_PAGINATION_DEFAULT_PAGE_SIZE'),
    
    // MODULES
    appointmentsEnabled: getBoolean('APPS2_APPOINTMENTS_ENABLED'),
    specialitiesEnabled: getBoolean('APPS2_SPECIALITIES_ENABLED'),
    medicalCentersEnabled: getBoolean('APPS2_MEDICAL_CENTERS_ENABLED'),


    // OTHER
    mockedDataEnabled: getBoolean('APPS2_MOCKED_DATA'),
    appointmentsExpirationIntervalMs: getNumber('APPS2_APPOINTMENT_EXPIRATION_INTERVAL_MS'), 
    appointmentsReminderIntervalMs: getNumber('APPS2_APPOINTMENT_REMINDER_INTERVAL_MS'),
    appointmentsAbsenceIntervalMs: getNumber('APPS2_APPOINTMENT_ABSENCE_INTERVAL_MS'),

    // INTEGRATIONS
    // Notifications
    notificationsEnabled: getBoolean('APPS2_INTEGRATIONS_NOTIFICATIONS_ENABLED'),
    notificationsBaseUrl: getRequired('APPS2_INTEGRATIONS_NOTIFICATIONS_BASE_URL'),
    notificationsApiKey: getRequired('APPS2_INTEGRATIONS_NOTIFICATIONS_API_KEY'),

    // Gateway
    inboundApiKeyEnabled: getOptionalBoolean('APPS2_INBOUND_API_KEY_ENABLED', true),
    inboundApiKey: getOptional('APPS2_INBOUND_API_KEY') || 'appointments-secret-key',

    // Core
    coreEnabled: getOptionalBoolean('APPS2_CORE_ENABLED', true),
    coreBaseUrl: getOptional('APPS2_CORE_BASE_URL') || 'https://gw.healthcare.cantero.ar/api/core',
    coreEmail: getOptional('APPS2_CORE_EMAIL'),
    corePassword: getOptional('APPS2_CORE_PASSWORD'),
    corePublisherModule: getOptional('APPS2_CORE_PUBLISHER_MODULE') || 'appointments',
    coreSsoRedirectFallback: getOptional('APPS2_CORE_SSO_REDIRECT_FALLBACK') || '/',
    coreEventModule1CheckInId: getOptionalNumber('APPS2_CORE_EVENT_MODULE1_CHECK_IN_ID'),
    coreEventModule5HighComplexityCancelledId: getOptionalNumber('APPS2_CORE_EVENT_MODULE5_HIGH_COMPLEXITY_CANCELLED_ID'),
    coreEventModule6SurgeryCancelledId: getOptionalNumber('APPS2_CORE_EVENT_MODULE6_SURGERY_CANCELLED_ID'),
    coreEventModule6SurgeryRescheduledId: getOptionalNumber('APPS2_CORE_EVENT_MODULE6_SURGERY_RESCHEDULED_ID'),
    coreEventAppointmentCreateRequestedId: getOptionalNumber('APPS2_CORE_EVENT_APPOINTMENT_CREATE_REQUESTED_ID') || 4,
    coreEventAppointmentGetRequestedId: getOptionalNumber('APPS2_CORE_EVENT_APPOINTMENT_GET_REQUESTED_ID') || 5,
    coreEventAppointmentCancelRequestedId: getOptionalNumber('APPS2_CORE_EVENT_APPOINTMENT_CANCEL_REQUESTED_ID') || 6,
    coreEventAppointmentRescheduleRequestedId: getOptionalNumber('APPS2_CORE_EVENT_APPOINTMENT_RESCHEDULE_REQUESTED_ID') || 7,
    coreEventAppointmentStartRequestedId: getOptionalNumber('APPS2_CORE_EVENT_APPOINTMENT_START_REQUESTED_ID') || 8,
    coreEventAppointmentFinishRequestedId: getOptionalNumber('APPS2_CORE_EVENT_APPOINTMENT_FINISH_REQUESTED_ID') || 9,
    coreEventNotificationGetRequestedId: getOptionalNumber('APPS2_CORE_EVENT_NOTIFICATION_GET_REQUESTED_ID') || 10,

    // RabbitMQ
    rabbitEnabled: getOptionalBoolean('APPS2_RABBITMQ_ENABLED', true),
    rabbitUrl: getFirstOptional('APPS2_RABBITMQ_URL', 'RABBITMQ_URL'),
    rabbitHost: getFirstOptional('APPS2_RABBITMQ_HOST', 'RABBITMQ_HOST') || 'queue.healthgrid.cantero.ar',
    rabbitPort: getFirstOptionalNumber('APPS2_RABBITMQ_PORT', 'RABBITMQ_PORT') || 5672,
    rabbitUser: getFirstOptional('APPS2_CORE_EMAIL', 'RABBITMQ_USER'),
    rabbitPassword: getFirstOptional('APPS2_CORE_PASSWORD', 'RABBITMQ_PASSWORD'),
    rabbitVhost: getFirstOptional('APPS2_RABBITMQ_VHOST', 'RABBITMQ_VHOST') || '/',
    rabbitAppointmentsRequestsQueue: getOptionalWithDefault('APPS2_RABBITMQ_APPOINTMENTS_REQUESTS_QUEUE', 'appointments.requests'),
  }
};
