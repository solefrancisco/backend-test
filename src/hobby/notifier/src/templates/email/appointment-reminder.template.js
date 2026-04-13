const {
  buildAppointmentEmailLayout,
  buildAppointmentEmailText,
} = require('./base-email.template');

function renderAppointmentReminderTemplate(data) {
  const subject = 'Recordatorio de turno';

  return {
    subject,
    html: buildAppointmentEmailLayout({
      title: 'Recordatorio de turno',
      preheader: 'Te recordamos que tenés un turno próximo.',
      badgeText: 'Recordatorio',
      badgeBackground: '#E8F1ED',
      badgeColor: '#0A6A4A',
      intro: 'te recordamos que tenés un turno próximo.',
      patient_name: data.patient_name,
      medic_name: data.medic_name,
      specialty: data.specialty,
      starts_at: data.starts_at,
      location: data.location,
      ctaText: 'Te recomendamos revisar la ubicación y presentarte con anticipación.',
      footerNote: 'Este es un recordatorio automático.',
      hasApiKey: Boolean(data.apiKey),
      headerBackground: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      headerEyebrowColor: '#475467',
      headerTitleColor: '#344054',
    }),
    text: buildAppointmentEmailText({
      title: 'Recordatorio de turno',
      intro: 'te recordamos que tenés un turno próximo.',
      patient_name: data.patient_name,
      medic_name: data.medic_name,
      specialty: data.specialty,
      starts_at: data.starts_at,
      location: data.location,
      footerNote: 'Te recomendamos revisar la ubicación y presentarte con anticipación.',
      hasApiKey: Boolean(data.apiKey),
    }),
  };
}

module.exports = { renderAppointmentReminderTemplate };