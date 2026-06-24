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
            from: `Confirmacion de turno pendiente <pendiente@${env.smtpBaseDomain}>`
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
        },
        appointment_checked_in: {
            from: `Check-in de turno <checkin@${env.smtpBaseDomain}>`
        },
        appointment_finished: {
            from: `Turno finalizado <finalizados@${env.smtpBaseDomain}>`
        },
        appointment_expired: {
            from: `Turno expirado <cancelaciones@${env.smtpBaseDomain}>`
        },
        appointment_absent: {
            from: `Ausencia de paciente <ausencias@${env.smtpBaseDomain}>`
        }
    }
  }
};