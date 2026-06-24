const {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
} = require('./base-email.template');

function renderAppointmentCheckedInTemplate(data) {
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
  const subject = 'Registramos tu llegada al centro médico';

  return {
    subject,
    html: buildAppointmentPatientEmailLayout({
      title: 'Check-in realizado',
      preheader: 'Tu presencia fue confirmada en el centro médico.',
      badgeText: 'Presente',
      badgeBackground: '#E6F4EC',
      badgeColor: '#0A6A4A',
      intro: 'registramos tu llegada al centro médico correctamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      checked_in_at: data.appointment.checked_in_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Aguardá a ser llamado para la atención médica.',
      footerNote: 'Este mensaje confirma que un administrativo registró tu presencia.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #ECFDF3 0%, #D1FADF 100%)',
      headerEyebrowColor: '#067647',
      headerTitleColor: '#065F46',
    }),
    text: buildAppointmentPatientEmailText({
      title: 'Check-in realizado',
      intro: 'registramos tu llegada al centro médico correctamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      checked_in_at: data.appointment.checked_in_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Aguardá a ser llamado para la atención médica.\n\n' +
        'Este mensaje confirma que un administrativo registró tu presencia.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

function buildMedicTemplate(data) {
  const subject = 'El paciente realizó el check-in';

  return {
    subject,
    html: buildAppointmentMedicEmailLayout({
      title: 'Paciente presente',
      preheader: 'El paciente llegó al centro médico y su presencia fue confirmada.',
      badgeText: 'Paciente presente',
      badgeBackground: '#EEF4FF',
      badgeColor: '#175CD3',
      intro: 'el paciente llegó al centro médico y ya fue registrado por administración.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      checked_in_at: data.appointment.checked_in_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'El paciente se encuentra disponible para ser llamado a la sala.',
      footerNote: 'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      headerEyebrowColor: '#1D4ED8',
      headerTitleColor: '#1E3A8A',
    }),
    text: buildAppointmentMedicEmailText({
      title: 'Paciente presente',
      intro: 'el paciente llegó al centro médico y ya fue registrado por administración.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      checked_in_at: data.appointment.checked_in_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'El paciente se encuentra disponible para ser llamado a la sala.\n\n' +
        'Este mensaje es únicamente informativo para mantener actualizada tu agenda.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentCheckedInTemplate };