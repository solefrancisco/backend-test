const mysql = require('mysql2/promise');
const { env } = require('./env.config');

const dbPool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  connectionLimit: env.dbConnectionLimit,
  namedPlaceholders: false,
  queueLimit: env.dbQueueLimit,
  waitForConnections: env.dbWaitForConnections,
  enableKeepAlive: true
});

module.exports = { dbPool };