const { env } = require('@notify/configs/env.config');

module.exports = {
  emailConfig: {
    smtpHost: env.smtpHost,
    smtpPort: env.smtpPort,
    smtpSecure: env.smtpSecure,
    smtpUser: `${env.smtpUser}@${env.smtpBaseDomain}`,
    smtpPass: env.smtpPass,
    emails: {
        appointment_pending_confirmation: {
            from: `Confirmaciones de turno <pendiente@${env.smtpBaseDomain}>`
        },
        appointment_confirmed: {
            from: `Turno confirmado <confirmaciones@${env.smtpBaseDomain}>`
        },
        appointment_cancelled: {
            from: `Cancelación de turno <cancelaciones@${env.smtpBaseDomain}>`
        },
        appointment_rescheduled: {
            from: `Reprogramación de turno <reprogramaciones@${env.smtpBaseDomain}>`
        },
        appointment_reminder: {
            from: `Recordatorio de turno <recordatorios@${env.smtpBaseDomain}>`
        }
    }
  }
};