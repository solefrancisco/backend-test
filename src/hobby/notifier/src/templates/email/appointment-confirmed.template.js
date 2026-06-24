const {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
} = require('./base-email.template');

function renderAppointmentConfirmedTemplate(data) {
  return [
    {
      to: data.patient.email,
      destination: 'patient',
      template: buildPatientTemplate(data),
    },
    {
      to: data.medic.email,
      destination: 'medic',
      template: buildMedicTemplate(data),
    },
  ];
}

function buildPatientTemplate(data) {
  const subject = 'Tu turno fue confirmado';

  return {
    subject,
    html: buildAppointmentPatientEmailLayout({
      title: 'Turno confirmado',
      preheader: 'Tu turno fue confirmado exitosamente.',
      badgeText: 'Confirmado',
      badgeBackground: '#E6F4EC',
      badgeColor: '#0A6A4A',
      intro: 'tu turno fue confirmado exitosamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      confirmed_at: data.appointment.confirmed_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Te recomendamos presentarte unos minutos antes del horario indicado.',
      footerNote: 'Conservá este correo como referencia de tu turno.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #003F2D 0%, #0A6A4A 100%)',
      headerEyebrowColor: '#CFE7DB',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentPatientEmailText({
      title: 'Turno confirmado',
      intro: 'tu turno fue confirmado exitosamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      confirmed_at: data.appointment.confirmed_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Te recomendamos presentarte unos minutos antes del horario indicado.\n\n' +
        'Conservá este correo como referencia de tu turno.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

function buildMedicTemplate(data) {
  const subject = 'Turno confirmado en tu agenda';

  return {
    subject,
    html: buildAppointmentMedicEmailLayout({
      title: 'Turno confirmado',
      preheader: 'El paciente confirmó el turno asociado a tu agenda.',
      badgeText: 'Agenda confirmada',
      badgeBackground: '#E6F4EC',
      badgeColor: '#0A6A4A',
      intro: 'el paciente confirmó el turno asociado a tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      confirmed_at: data.appointment.confirmed_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'La reserva quedó confirmada y agendada correctamente.',
      footerNote: 'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #003F2D 0%, #0A6A4A 100%)',
      headerEyebrowColor: '#CFE7DB',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentMedicEmailText({
      title: 'Turno confirmado',
      intro: 'el paciente confirmó el turno asociado a tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      confirmed_at: data.appointment.confirmed_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'La reserva quedó confirmada y agendada correctamente.\n\n' +
        'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentConfirmedTemplate };