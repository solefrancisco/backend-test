const { env } = require('./env.config');

const integrationConfig = {
    notificationsEnabled: env.notificationsEnabled,
    notificationsBaseUrl: env.notificationsBaseUrl,
    notificationsApiKey: env.notificationsApiKey,
}

module.exports = { integrationConfig };