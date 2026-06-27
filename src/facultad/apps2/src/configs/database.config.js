const mysql = require('mysql2/promise');
const { env } = require('./env.config');

function createPoolConfig({ host, port, user, password, database, connectionLimit, queueLimit, waitForConnections }) {
  return {
    host,
    port,
    user,
    password,
    database,
    connectionLimit,
    namedPlaceholders: false,
    queueLimit,
    waitForConnections,
    enableKeepAlive: true
  };
}

const dbPool = mysql.createPool(createPoolConfig({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  connectionLimit: env.dbConnectionLimit,
  queueLimit: env.dbQueueLimit,
  waitForConnections: env.dbWaitForConnections
}));

const testDbPool = env.environment === 'production'
  ? mysql.createPool(createPoolConfig({
    host: env.testDbHost,
    port: env.testDbPort,
    user: env.testDbUser,
    password: env.testDbPassword,
    database: env.testDbName,
    connectionLimit: env.testDbConnectionLimit ?? env.dbConnectionLimit,
    queueLimit: env.testDbQueueLimit ?? env.dbQueueLimit,
    waitForConnections: env.dbWaitForConnections
  }))
  : null;

module.exports = { dbPool, testDbPool };
