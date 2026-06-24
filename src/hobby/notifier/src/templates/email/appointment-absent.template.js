const {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
} = require('./base-email.template');

function renderAppointmentAbsentTemplate(data) {
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
  const subject = 'Registramos tu ausencia al turno';

  return {
    subject,
    html: buildAppointmentPatientEmailLayout({
      title: 'Ausencia registrada',
      preheader: 'Registramos que no te presentaste a tu turno.',
      badgeText: 'Ausente',
      badgeBackground: '#FFF4E5',
      badgeColor: '#B54708',
      intro: 'registramos que no te presentaste a tu turno.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Si todavía necesitás atención médica, podés solicitar un nuevo turno desde el portal.',
      footerNote: 'Ante cualquier duda o si considerás que hubo un error, comunicate con el centro médico.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #FFFAEB 0%, #FEF0C7 100%)',
      headerEyebrowColor: '#B54708',
      headerTitleColor: '#93370D',
    }),
    text: buildAppointmentPatientEmailText({
      title: 'Ausencia registrada',
      intro: 'registramos que no te presentaste a tu turno.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Si todavía necesitás atención médica, podés solicitar un nuevo turno desde el portal.\n\n' +
        'Ante cualquier duda o si considerás que hubo un error, comunicate con el centro médico.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

function buildMedicTemplate(data) {
  const subject = 'Un paciente no se presentó al turno';

  return {
    subject,
    html: buildAppointmentMedicEmailLayout({
      title: 'Paciente ausente',
      preheader: 'Un paciente no se presentó a un turno de tu agenda.',
      badgeText: 'Ausencia registrada',
      badgeBackground: '#FFFAEB',
      badgeColor: '#B54708',
      intro: 'un paciente no se presentó a un turno de tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'El turno quedó marcado como ausencia del paciente.',
      footerNote: 'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #FFFAEB 0%, #FEF0C7 100%)',
      headerEyebrowColor: '#B54708',
      headerTitleColor: '#93370D',
    }),
    text: buildAppointmentMedicEmailText({
      title: 'Paciente ausente',
      intro: 'un paciente no se presentó a un turno de tu agenda profesional.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'El turno quedó marcado como ausencia del paciente.\n\n' +
        'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentAbsentTemplate };