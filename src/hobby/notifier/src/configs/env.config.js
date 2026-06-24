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
    dbEnabled: getBoolean('NOTIFIER_DB_ENABLED'),
    dbHost: getRequired('NOTIFIER_DB_HOST'),
    dbPort: getNumber('NOTIFIER_DB_PORT'),
    dbUser: getRequired('NOTIFIER_DB_USER'),
    dbPassword: getRequired('NOTIFIER_DB_PASSWORD'),
    dbName: getRequired('NOTIFIER_DB_NAME'),
    dbConnectionLimit: getNumber('NOTIFIER_DB_CONNECTION_LIMIT'),
    dbQueueLimit: getNumber('NOTIFIER_DB_QUEUE_LIMIT'),
    dbWaitForConnections: getBoolean('NOTIFIER_DB_WAIT_FOR_CONNECTIONS'),
    
    // PAGINATION
    paginationDefaultPageSize: getRequired('NOTIFIER_PAGINATION_DEFAULT_PAGE_SIZE'),

    // MODULES
    notifierEnabled: getBoolean('NOTIFIER_NOTIFY_ENABLED'),
    apps2_environmentUrl: getRequired('APPS2_ENVIRONMENT_URL'),
    //token para pegarle al modulo 6
    Module_6_TOKEN: ('M6_TOKEN'),
    Module_6_URL: ('M6_URL'),

    // RABBITMQ
    rabbitMQEnabled: getBoolean('NOTIFIER_RABBITMQ_ENABLED'),
    rabbitMQURL: getRequired('NOTIFIER_RABBITMQ_URL'),
    rabbitMQMaxRetries: getNumber('NOTIFIER_RABBITMQ_MAX_RETRIES'),
    rabbitMQRetryHeader: getRequired('NOTIFIER_RABBITMQ_RETRY_HEADER'),

    // SMTP EMAIL
    smtpHost: getRequired('NOTIFIER_SMTP_HOST'),
    smtpPort: getNumber('NOTIFIER_SMTP_PORT'),
    smtpSecure: getBoolean('NOTIFIER_SMTP_SECURE'),
    smtpBaseDomain: getRequired('NOTIFIER_SMTP_BASE_DOMAIN'),
    smtpUser: getRequired('NOTIFIER_SMTP_USER'),
    smtpPass: getRequired('NOTIFIER_SMTP_PASS'),

    // HMAC
    hmacSecret: getRequired('NOTIFIER_API_KEY_HMAC_SECRET'),
    aesSecret: getRequired('NOTIFIER_AES_SECRET'),
    aesIvLength: getNumber('NOTIFIER_AES_IV_LENGTH'),
    aesAlgorithm: getRequired('NOTIFIER_AES_ALGORITHM'),
    aesAuthTagLength: getNumber('NOTIFIER_AES_AUTH_TAG_LENGTH')
  }
};