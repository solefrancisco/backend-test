const {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
} = require('./base-email.template');

function renderAppointmentFinishedTemplate(data) {
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
  const subject = 'Tu turno finalizó';

  return {
    subject,
    html: buildAppointmentPatientEmailLayout({
      title: 'Atención finalizada',
      preheader: 'Tu atención médica fue finalizada por el profesional.',
      badgeText: 'Finalizado',
      badgeBackground: '#F2F4F7',
      badgeColor: '#475467',
      intro: 'tu atención médica fue finalizada correctamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      finished_at: data.appointment.finished_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'Gracias por asistir. Recordá seguir las indicaciones brindadas por el profesional.',
      footerNote: 'Este mensaje confirma que el turno fue marcado como finalizado.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #F9FAFB 0%, #EAECF0 100%)',
      headerEyebrowColor: '#475467',
      headerTitleColor: '#344054',
    }),
    text: buildAppointmentPatientEmailText({
      title: 'Atención finalizada',
      intro: 'tu atención médica fue finalizada correctamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      finished_at: data.appointment.finished_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'Gracias por asistir. Recordá seguir las indicaciones brindadas por el profesional.\n\n' +
        'Este mensaje confirma que el turno fue marcado como finalizado.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

function buildMedicTemplate(data) {
  const subject = 'Turno finalizado en tu agenda';

  return {
    subject,
    html: buildAppointmentMedicEmailLayout({
      title: 'Atención finalizada',
      preheader: 'Confirmaste la finalización del turno en tu agenda.',
      badgeText: 'Finalizado',
      badgeBackground: '#F2F4F7',
      badgeColor: '#475467',
      intro: 'confirmaste que la atención del paciente finalizó correctamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      finished_at: data.appointment.finished_at,
      medical_center_name: data.appointment.medical_center_name,
      ctaText: 'El turno quedó cerrado en tu agenda profesional.',
      footerNote: 'Este mensaje es únicamente informativo para dejar constancia del cierre del turno.',
      notification_sent_by: data.notification_sent_by,
      headerBackground: 'linear-gradient(135deg, #F9FAFB 0%, #EAECF0 100%)',
      headerEyebrowColor: '#475467',
      headerTitleColor: '#344054',
    }),
    text: buildAppointmentMedicEmailText({
      title: 'Atención finalizada',
      intro: 'confirmaste que la atención del paciente finalizó correctamente.',
      patient_name: data.patient.fullname,
      medic_name: data.medic.fullname,
      speciality: data.appointment.speciality_name,
      starts_at: data.appointment.starts_at,
      finished_at: data.appointment.finished_at,
      medical_center_name: data.appointment.medical_center_name,
      footerNote:
        'El turno quedó cerrado en tu agenda profesional.\n\n' +
        'Este mensaje es únicamente informativo para dejar constancia del cierre del turno.',
      notification_sent_by: data.notification_sent_by,
    }),
  };
}

module.exports = { renderAppointmentFinishedTemplate };