const {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
} = require('./base-email.template');

function renderAppointmentReminderTemplate(data) {
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
  const subject = 'Recordatorio de turno';

  return {
    subject,
    html: buildAppointmentPatientEmailLayout({
      title: 'Recordatorio de turno',
      preheader: 'Te recordamos que tenés un turno próximo.',
      badgeText: 'Recordatorio',
      badgeBackground: '#EEF4FF',
      badgeColor: '#3538CD',
      intro: 'te recordamos que tenés un turno próximo.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Te recomendamos revisar la ubicación y presentarte con anticipación.',
      footerNote: 'Este es un recordatorio automático de tu turno.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #38BDF8 100%)',
      headerEyebrowColor: '#DBEAFE',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentPatientEmailText({
      title: 'Recordatorio de turno',
      intro: 'te recordamos que tenés un turno próximo.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Te recomendamos revisar la ubicación y presentarte con anticipación.\n\n' +
        'Este es un recordatorio automático de tu turno.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

function buildMedicTemplate(data) {
  const subject = 'Recordatorio de turno en tu agenda';

  return {
    subject,
    html: buildAppointmentMedicEmailLayout({
      title: 'Recordatorio de turno',
      preheader: 'Tenés un turno próximo en tu agenda.',
      badgeText: 'Próximo turno',
      badgeBackground: '#EEF4FF',
      badgeColor: '#3538CD',
      intro: 'tenés un turno próximo asociado a tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Te recomendamos revisar tu agenda antes del horario indicado.',
      footerNote: 'Este mensaje es únicamente informativo para ayudarte a organizar tu atención.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #38BDF8 100%)',
      headerEyebrowColor: '#DBEAFE',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentMedicEmailText({
      title: 'Recordatorio de turno',
      intro: 'tenés un turno próximo asociado a tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Te recomendamos revisar tu agenda antes del horario indicado.\n\n' +
        'Este mensaje es únicamente informativo para ayudarte a organizar tu atención.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentReminderTemplate };