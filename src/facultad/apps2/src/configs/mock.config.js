const { env } = require('./env.config');

const mockConfig = {
    enabled: env.mockedDataEnabled,
}

module.exports = { mockConfig };