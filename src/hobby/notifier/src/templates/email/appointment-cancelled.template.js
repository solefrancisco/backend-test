const {
  buildAppointmentEmailLayout,
  buildAppointmentEmailText,
} = require('./base-email.template');

function renderAppointmentCancelledTemplate(data) {
  const subject = 'Tu turno fue cancelado';

  return {
    subject,
    html: buildAppointmentEmailLayout({
      title: 'Turno cancelado',
      preheader: 'Tu turno fue cancelado.',
      badgeText: 'Cancelado',
      badgeBackground: '#FDECEC',
      badgeColor: '#B42318',
      intro: 'tu turno fue cancelado.',
      patientName: data.patientName,
      medicName: data.medicName,
      specialty: data.specialty,
      startsAt: data.startsAt,
      location: data.location,
      ctaText: 'Si necesitás atención, te sugerimos solicitar un nuevo turno.',
      footerNote: 'Ante cualquier duda, comunicate con el centro de atención.',
      hasApiKey: Boolean(data.apiKey),
      headerBackground: 'linear-gradient(135deg, #FEF3F2 0%, #FEE4E2 100%)',
      headerEyebrowColor: '#B42318',
      headerTitleColor: '#912018',
    }),
    text: buildAppointmentEmailText({
      title: 'Turno cancelado',
      intro: 'tu turno fue cancelado.',
      patientName: data.patientName,
      medicName: data.medicName,
      specialty: data.specialty,
      startsAt: data.startsAt,
      location: data.location,
      footerNote: 'Si necesitás atención, te sugerimos solicitar un nuevo turno.',
      hasApiKey: Boolean(data.apiKey),
    }),
  };
}

module.exports = { renderAppointmentCancelledTemplate };