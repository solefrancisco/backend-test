const {
  buildAppointmentEmailLayout,
  buildAppointmentEmailText,
} = require('./base-email.template');

function renderAppointmentConfirmedTemplate(data) {
  const subject = 'Tu turno fue confirmado';

  return {
    subject,
    html: buildAppointmentEmailLayout({
      title: 'Turno confirmado',
      preheader: 'Tu turno fue confirmado.',
      badgeText: 'Confirmado',
      badgeBackground: '#E6F4EC',
      badgeColor: '#0A6A4A',
      intro: 'tu turno fue confirmado exitosamente.',
      patientName: data.patientName,
      medicName: data.medicName,
      specialty: data.specialty,
      startsAt: data.startsAt,
      location: data.location,
      ctaText: 'Te recomendamos presentarte unos minutos antes del horario indicado.',
      footerNote: 'Conservá este correo como referencia de tu turno.',
      hasApiKey: Boolean(data.apiKey),
      headerBackground: 'linear-gradient(135deg, #003F2D 0%, #0A6A4A 100%)',
      headerEyebrowColor: '#CFE7DB',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentEmailText({
      title: 'Turno confirmado',
      intro: 'tu turno fue confirmado exitosamente.',
      patientName: data.patientName,
      medicName: data.medicName,
      specialty: data.specialty,
      startsAt: data.startsAt,
      location: data.location,
      footerNote: 'Te recomendamos presentarte unos minutos antes del horario indicado.',
      hasApiKey: Boolean(data.apiKey),
    }),
  };
}

module.exports = { renderAppointmentConfirmedTemplate };