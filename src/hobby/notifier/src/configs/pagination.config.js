const { env } = require('@notify/configs/env.config');

const paginationConfig = {
    defaultPage: 1,
    defaultPageSize: Number(env.paginationDefaultPageSize),
}

module.exports = { paginationConfig };