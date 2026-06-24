const {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
} = require('./base-email.template');

function renderAppointmentCancelledTemplate(data) {
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
  const subject = 'Tu turno fue cancelado';

  return {
    subject,
    html: buildAppointmentPatientEmailLayout({
      title: 'Turno cancelado',
      preheader: 'Tu turno fue cancelado.',
      badgeText: 'Cancelado',
      badgeBackground: '#FDECEC',
      badgeColor: '#B42318',
      intro: 'tu turno fue cancelado.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      cancelled_at: data.appointment.cancelled_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Si necesitás atención médica, podés solicitar un nuevo turno desde el portal.',
      footerNote: 'Ante cualquier duda o inconveniente, comunicate con el centro médico.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #FEF3F2 0%, #FEE4E2 100%)',
      headerEyebrowColor: '#B42318',
      headerTitleColor: '#912018',
    }),
    text: buildAppointmentPatientEmailText({
      title: 'Turno cancelado',
      intro: 'tu turno fue cancelado.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      cancelled_at: data.appointment.cancelled_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Si necesitás atención médica, podés solicitar un nuevo turno desde el portal.\n\n' +
        'Ante cualquier duda o inconveniente, comunicate con el centro médico.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

function buildMedicTemplate(data) {
  const subject = 'Se canceló un turno de tu agenda';

  return {
    subject,
    html: buildAppointmentMedicEmailLayout({
      title: 'Turno cancelado',
      preheader: 'Un turno asociado a tu agenda profesional fue cancelado.',
      badgeText: 'Agenda actualizada',
      badgeBackground: '#FEF3F2',
      badgeColor: '#B42318',
      intro: 'se canceló un turno asociado a tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      cancelled_at: data.appointment.cancelled_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'La franja horaria correspondiente quedó liberada en tu agenda.',
      footerNote: 'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #FEF3F2 0%, #FEE4E2 100%)',
      headerEyebrowColor: '#B42318',
      headerTitleColor: '#912018',
    }),
    text: buildAppointmentMedicEmailText({
      title: 'Turno cancelado',
      intro: 'se canceló un turno asociado a tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      cancelled_at: data.appointment.cancelled_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'La franja horaria correspondiente quedó liberada en tu agenda.\n\n' +
        'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentCancelledTemplate };