const nodemailer = require('nodemailer');
const { emailConfig } = require('@notify/configs/email.config');
const { BadRequestError } = require('@notify/errors/bad-request.error');

function createEmailTransporter(notification_type) {
    const emailAccount = emailConfig.emails[notification_type];

    if (!emailAccount) {
        throw new BadRequestError('Invalid email notification email type');
    }
    
    const transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpSecure,
        auth: {
            user: emailConfig.smtpUser,
            pass: emailConfig.smtpPass,
        },
    });

    return {
        transporter,
        emailAccount,
    };
}

module.exports = {
  createEmailTransporter,
};