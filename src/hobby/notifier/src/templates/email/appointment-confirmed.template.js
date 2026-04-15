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
      patient_name: data.patient_name,
      medic_name: data.medic_name,
      speciality: data.speciality,
      starts_at: data.starts_at,
      location: data.location,
      ctaText: 'Te recomendamos presentarte unos minutos antes del horario indicado.',
      footerNote: 'Conservá este correo como referencia de tu turno.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #003F2D 0%, #0A6A4A 100%)',
      headerEyebrowColor: '#CFE7DB',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentEmailText({
      title: 'Turno confirmado',
      intro: 'tu turno fue confirmado exitosamente.',
      patient_name: data.patient_name,
      medic_name: data.medic_name,
      speciality: data.speciality,
      starts_at: data.starts_at,
      location: data.location,
      footerNote: 'Te recomendamos presentarte unos minutos antes del horario indicado.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentConfirmedTemplate };