const { rabbitConfig } = require('@notify/configs/rabbitmq.config');
const { connectRabbit } = require('@notify/integrations/messaging/rabbit.client');
const { createEmailTransporter } = require('@notify/integrations/email/email.client');
const { renderEmailTemplate } = require('@notify/templates/email');
const { stat } = require('node:fs');

async function processEmailNotification(data, transporter, emailAccount) {
    const emails = renderEmailTemplate(data);

    for (const email of emails) {
        console.log(`${data.request_id} - Sending email notification to ${email.destination}`);

        const result = await transporter.sendMail({
            from: emailAccount.from,
            to: email.to,
            subject: email.template.subject,
            html: email.template.html,
            text: email.template.text,
        });
    }
}

function getRetryCount(message) {
    return Number(message.properties?.headers?.[rabbitConfig.retryHeader] ?? 0); 
}

async function requeueMessage(channel, message, retryCount) {
    const nextRetryCount = retryCount + 1;

    const retryQueueMapper = {
        1: rabbitConfig.queues.email.retry1,
        2: rabbitConfig.queues.email.retry2,
        3: rabbitConfig.queues.email.retry3,
    }

    const isDeadLetter = retryCount >= rabbitConfig.maxRetries;
    const targetQueue = isDeadLetter ? rabbitConfig.queues.email.deadLetter : retryQueueMapper[nextRetryCount];

    const sent = channel.sendToQueue(
        targetQueue,
        message.content,
        {
            persistent: true,
            contentType: message.properties.contentType || 'application/json',
            headers: {
                ...(message.properties.headers || {}),
                [rabbitConfig.retryHeader]: nextRetryCount,
            },
        }
    );

    if (!sent) {
        throw new Error('RabbitMQ write buffer is full while requeueing email notification');
    }

    return {
        status: isDeadLetter ? 'dead' : 'retrying',
        retryCount: nextRetryCount
    };
}

async function startEmailConsumer(consumerRepository) {
    const channel = await connectRabbit();
    
    await channel.assertQueue(rabbitConfig.queues.email.default, { durable: true });
    channel.prefetch(1);

    channel.consume(rabbitConfig.queues.email.default, async (message) => {
        if (!message) {
            return;
        }

        const retryCount = getRetryCount(message);
        let status;
        let data;
        try {
            status = "processing";
            const rawContent = message.content.toString();
            data = JSON.parse(rawContent);
            await consumerRepository.updateStatus(data.request_id, status);

            const { transporter, emailAccount } = createEmailTransporter(data.notification_type);
            await processEmailNotification(data, transporter, emailAccount);

            channel.ack(message);
            status = 'sent';
        } catch (error) {
            try { 
                console.error(`${data.request_id} - Error processing email notification:`, error);
                const result = await requeueMessage(channel, message, retryCount);
                await consumerRepository.updateRetryCount(data.request_id, result.retryCount);

                status = result.status;
                channel.ack(message);
            } catch (requeueError) {
                status = 'failed';
                channel.nack(message, false, false);
            }
        }
        await consumerRepository.updateStatus(data.request_id, status);
    });
}

module.exports = {
  startEmailConsumer,
  processEmailNotification,
};