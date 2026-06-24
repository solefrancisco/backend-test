// appointment-expired.template.js

const {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
} = require('./base-email.template');

function renderAppointmentExpiredTemplate(data) {
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
  const subject = 'Tu turno expiró';

  return {
    subject,
    html: buildAppointmentPatientEmailLayout({
      title: 'Turno expirado',
      preheader: 'Tu turno expiró porque no fue confirmado a tiempo.',
      badgeText: 'Expirado',
      badgeBackground: '#FDECEC',
      badgeColor: '#9B1C1C',
      intro: 'tu turno ya no se encuentra disponible porque expiró antes de ser confirmado.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      expired_at: data.appointment.expired_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Si todavía necesitás atenderte, podés solicitar un nuevo turno.',
      footerNote: 'Este turno quedó vencido automáticamente por falta de confirmación.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #5F1515 0%, #9B1C1C 100%)',
      headerEyebrowColor: '#F8D7DA',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentPatientEmailText({
      title: 'Turno expirado',
      intro: 'tu turno ya no se encuentra disponible porque expiró antes de ser confirmado.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      expired_at: data.appointment.expired_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Si todavía necesitás atenderte, podés solicitar un nuevo turno.\n\n' +
        'Este turno quedó vencido automáticamente por falta de confirmación.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

function buildMedicTemplate(data) {
  const subject = 'Un turno expiró en tu agenda';

  return {
    subject,
    html: buildAppointmentMedicEmailLayout({
      title: 'Turno expirado',
      preheader: 'Un turno asignado expiró porque no fue confirmado a tiempo.',
      badgeText: 'Expirado',
      badgeBackground: '#FDECEC',
      badgeColor: '#9B1C1C',
      intro: 'un turno asociado a tu agenda expiró porque no fue confirmado a tiempo.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      expired_at: data.appointment.expired_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'No es necesario realizar ninguna acción sobre este turno.',
      footerNote: 'El turno fue marcado como expirado automáticamente por el sistema.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #5F1515 0%, #9B1C1C 100%)',
      headerEyebrowColor: '#F8D7DA',
      headerTitleColor: '#FFFFFF',
    }),
    text: buildAppointmentMedicEmailText({
      title: 'Turno expirado',
      intro: 'un turno asociado a tu agenda expiró porque no fue confirmado a tiempo.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      expired_at: data.appointment.expired_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'No es necesario realizar ninguna acción sobre este turno.\n\n' +
        'El turno fue marcado como expirado automáticamente por el sistema.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentExpiredTemplate };