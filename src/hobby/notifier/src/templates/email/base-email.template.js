function formatDateTime(dateTime) {
  return String(dateTime);
}

function buildDisclaimer(notification_sent_by) {
  return `
    <div style="margin-top: 24px; padding: 16px; border-radius: 12px; background-color: #FFF4E5; border: 1px solid #F5C98B;">
      <p style="margin: 0; font-size: 14px; line-height: 22px; color: #9A5B00;">
        Este correo fue generado por una solicitud de ${notification_sent_by}
      </p>
    </div>
  `;
}

function buildDisclaimerText(notification_sent_by) {
  return `\n\nEste correo fue generado por una solicitud de ${notification_sent_by}.`;
}

function buildAppointmentPatientEmailLayout(data) {
  return buildAppointmentEmailLayout({
    ...data,
    portalLabel: 'Portal del Paciente',
    greetingName: data.patient_name,
    greetingFallback: 'paciente',
    mainNameLabel: 'Profesional',
    mainName: data.medic_name,
    secondaryLabel: 'Especialidad',
    secondaryValue: data.speciality,
  });
}

function buildAppointmentMedicEmailLayout(data) {
  return buildAppointmentEmailLayout({
    ...data,
    portalLabel: 'Agenda Médica',
    greetingName: data.medic_name,
    greetingFallback: 'doctor/a',
    mainNameLabel: 'Paciente',
    mainName: data.patient_name,
    secondaryLabel: 'Especialidad',
    secondaryValue: data.speciality,
  });
}

function buildAppointmentEmailLayout({
  title,
  preheader,
  badgeText,
  badgeBackground,
  badgeColor,
  intro,
  portalLabel,
  greetingName,
  greetingFallback,
  mainNameLabel,
  mainName,
  secondaryLabel,
  secondaryValue,
  starts_at,
  original_starts_at,
  cancelled_at,
  confirmed_at,
  finished_at,
  medical_center_name,
  ctaText,
  footerNote,
  notification_sent_by,

  headerBackground = 'linear-gradient(135deg, #003F2D 0%, #0A6A4A 100%)',
  headerEyebrowColor = '#CFE7DB',
  headerTitleColor = '#FFFFFF',
}) {
  const disclaimerHtml = buildDisclaimer(notification_sent_by);
  const startsAtLabel = original_starts_at ? 'Nuevo horario' : 'Fecha y hora del turno';
  const cancelledAtLabel = cancelled_at ? `Fecha y hora de cancelación` : "";
  const confirmedAtLabel = confirmed_at ? `Fecha y hora de confirmación` : "";
  const finishedAtLabel = finished_at ? `Fecha y hora de finalización` : "";
  
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F5F7F4; font-family: Arial, Helvetica, sans-serif; color: #1C2B25;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
          ${preheader}
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F5F7F4; margin: 0; padding: 24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 680px; background-color: #FFFFFF; border: 1px solid #DCE7E0; border-radius: 20px; overflow: hidden;">
                <tr>
                  <td style="background: ${headerBackground}; padding: 32px 32px 24px 32px;">
                    <div style="font-size: 13px; line-height: 20px; letter-spacing: 1px; color: ${headerEyebrowColor}; text-transform: uppercase; margin-bottom: 10px;">
                      ${portalLabel}
                    </div>
                    <h1 style="margin: 0; font-size: 32px; line-height: 40px; color: ${headerTitleColor};">
                      ${title}
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px 32px 8px 32px;">
                    <span style="display: inline-block; padding: 8px 14px; border-radius: 999px; background-color: ${badgeBackground}; color: ${badgeColor}; font-size: 14px; font-weight: 700;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 8px 32px 0 32px;">
                    <p style="margin: 0; font-size: 16px; line-height: 26px; color: #4F655C;">
                      Hola ${greetingName || greetingFallback}, ${intro}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FBF9; border: 1px solid #DCE7E0; border-radius: 18px;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #667A72;">
                            ${mainNameLabel}
                          </p>

                          <p style="margin: 0 0 18px 0; font-size: 26px; line-height: 34px; font-weight: 700; color: #1C2B25;">
                            ${mainName || '-'}
                          </p>

                          <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px; color: #4F655C;">
                            <strong style="color: #1C2B25;">${secondaryLabel}:</strong> ${secondaryValue || '-'}
                          </p>

                          ${
                            original_starts_at
                              ? `
                          <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px; color: #4F655C;">
                            <strong style="color: #1C2B25;">Horario anterior:</strong> ${formatDateTime(original_starts_at)}
                          </p>
                          `
                              : ''
                          }

                          <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px; color: #4F655C;">
                            <strong style="color: #1C2B25;">${startsAtLabel}:</strong> ${formatDateTime(starts_at)}
                          </p>

                          ${
                            cancelled_at
                              ? `
                          <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px; color: #4F655C;">
                            <strong style="color: #1C2B25;">${cancelledAtLabel}</strong> ${formatDateTime(cancelled_at)}
                          </p>
                          `
                              : ''
                          }
                          
                          ${
                            confirmed_at
                              ? `
                          <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px; color: #4F655C;">
                            <strong style="color: #1C2B25;">${confirmedAtLabel}</strong> ${formatDateTime(confirmed_at)}
                          </p>
                          `
                              : ''
                          }
                          ${
                            finished_at
                              ? `
                          <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px; color: #4F655C;">
                            <strong style="color: #1C2B25;">${finishedAtLabel}</strong> ${formatDateTime(finished_at)}
                          </p>
                          `
                              : ''
                          }

                          <p style="margin: 0; font-size: 16px; line-height: 24px; color: #4F655C;">
                            <strong style="color: #1C2B25;">Ubicación:</strong> ${medical_center_name || '-'}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  ctaText
                    ? `
                <tr>
                  <td style="padding: 0 32px 8px 32px;">
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #4F655C;">
                      ${ctaText}
                    </p>
                  </td>
                </tr>
                `
                    : ''
                }

                <tr>
                  <td style="padding: 8px 32px 32px 32px;">
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #7A8D85;">
                      ${footerNote}
                    </p>
                    ${disclaimerHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildAppointmentPatientEmailText(data) {
  return buildAppointmentEmailText({
    ...data,
    greetingName: data.patient_name,
    greetingFallback: 'paciente',
    mainNameLabel: 'Profesional',
    mainName: data.medic_name,
  });
}

function buildAppointmentMedicEmailText(data) {
  return buildAppointmentEmailText({
    ...data,
    greetingName: data.medic_name,
    greetingFallback: 'doctor/a',
    mainNameLabel: 'Paciente',
    mainName: data.patient_name,
  });
}

function buildAppointmentEmailText({
  title,
  intro,
  greetingName,
  greetingFallback,
  mainNameLabel,
  mainName,
  speciality,
  starts_at,
  original_starts_at,
  medical_center_name,
  footerNote,
  notification_sent_by,
}) {
  return [
    title,
    '',
    `Hola ${greetingName || greetingFallback}, ${intro}`,
    '',
    `${mainNameLabel}: ${mainName || '-'}`,
    `Especialidad: ${speciality || '-'}`,
    original_starts_at ? `Horario anterior: ${formatDateTime(original_starts_at)}` : null,
    `Fecha y hora: ${formatDateTime(starts_at)}`,
    `Ubicación: ${medical_center_name || '-'}`,
    '',
    footerNote,
    buildDisclaimerText(notification_sent_by),
  ].filter(Boolean).join('\n');
}

module.exports = {
  buildAppointmentPatientEmailLayout,
  buildAppointmentMedicEmailLayout,
  buildAppointmentPatientEmailText,
  buildAppointmentMedicEmailText,
};