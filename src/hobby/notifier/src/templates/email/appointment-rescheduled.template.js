const {
  buildAppointmentEmailLayout,
  buildAppointmentEmailText,
} = require('./base-email.template');

function renderAppointmentRescheduledTemplate(data) {
  const subject = 'Tu turno fue reprogramado';

  return {
    subject,
    html: buildAppointmentEmailLayout({
      title: 'Turno reprogramado',
      preheader: 'Tu turno fue reprogramado con nueva fecha u horario.',
      badgeText: 'Reprogramado',
      badgeBackground: '#EEF3FF',
      badgeColor: '#1D4ED8',
      intro: 'tu turno fue reprogramado. Revisá los nuevos datos.',
      patientName: data.patientName,
      medicName: data.medicName,
      specialty: data.specialty,
      startsAt: data.startsAt,
      location: data.location,
      ctaText: 'Verificá la nueva fecha y horario para evitar inconvenientes.',
      footerNote: 'Si el nuevo horario no te resulta conveniente, solicitá un nuevo turno.',
      hasApiKey: Boolean(data.apiKey),
      headerBackground: 'linear-gradient(135deg, #EFF8FF 0%, #D1E9FF 100%)',
      headerEyebrowColor: '#175CD3',
      headerTitleColor: '#1849A9',
    }),
    text: buildAppointmentEmailText({
      title: 'Turno reprogramado',
      intro: 'tu turno fue reprogramado. Revisá los nuevos datos.',
      patientName: data.patientName,
      medicName: data.medicName,
      specialty: data.specialty,
      startsAt: data.startsAt,
      location: data.location,
      footerNote: 'Verificá la nueva fecha y horario para evitar inconvenientes.',
      hasApiKey: Boolean(data.apiKey),
    }),
  };
}

module.exports = { renderAppointmentRescheduledTemplate };