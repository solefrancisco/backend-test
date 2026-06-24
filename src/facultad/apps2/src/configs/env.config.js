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

module.exports = {
  env: {
    // APP
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
  }
};