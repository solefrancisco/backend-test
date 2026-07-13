const { env } = require('./env.config');

function buildRabbitUrl() {
    if (env.rabbitUrl) {
        return env.rabbitUrl;
    }

    if (!env.rabbitUser || !env.rabbitPassword) {
        return null;
    }

    const user = encodeURIComponent(env.rabbitUser);
    const password = encodeURIComponent(env.rabbitPassword);
    const vhost = env.rabbitVhost === '/' ? '' : encodeURIComponent(env.rabbitVhost);

    return `amqp://${user}:${password}@${env.rabbitHost}:${env.rabbitPort}/${vhost}`;
}

const rabbitConfig = {
    enabled: env.rabbitEnabled,
    url: buildRabbitUrl(),
    queues: {
        appointmentsRequests: env.rabbitAppointmentsRequestsQueue,
    },
};

module.exports = { rabbitConfig };
