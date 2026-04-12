const pino = require('pino');

const logger = pino(
  {
    level: 'info',
  },
  pino.transport({
    target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname'
        }
    })
);

module.exports = { logger };