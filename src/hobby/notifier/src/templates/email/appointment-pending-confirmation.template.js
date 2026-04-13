const { env } = require('@notify/configs/env.config');

const {
  buildAppointmentEmailLayout,
  buildAppointmentEmailText,
} = require('./base-email.template');

function renderAppointmentPendingConfirmationTemplate(data) {
  const subject = 'Confirmá o cancelá tu turno';
  const environmentUrl = env.apps2_environmentUrl;
  const baseUrl = `${environmentUrl}/appointments/${data.appointment_id}`;
  const confirmUrl = `${baseUrl}/confirm`;
  const cancelUrl = `${baseUrl}/cancel`;

  const actionsHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
      <tr>
        <td style="padding-right: 8px;">
          <a
            href="${confirmUrl}"
            style="
              display:inline-block;
              padding:14px 22px;
              background-color:#0A6A4A;
              color:#FFFFFF;
              text-decoration:none;
              border-radius:12px;
              font-size:15px;
              font-weight:700;
            "
          >
            Confirmar turno
          </a>
        </td>
        <td style="padding-left: 8px;">
          <a
            href="${cancelUrl}"
            style="
              display:inline-block;
              padding:14px 22px;
              background-color:#FFFFFF;
              color:#B42318;
              text-decoration:none;
              border-radius:12px;
              border:1px solid #F2B8B5;
              font-size:15px;
              font-weight:700;
            "
          >
            Cancelar turno
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject,
    html: buildAppointmentEmailLayout({
      title: 'Confirmación de turno',
      preheader: 'Confirmá o cancelá tu turno desde este correo.',
      badgeText: 'Acción requerida',
      badgeBackground: '#FFF4E5',
      badgeColor: '#C86A00',
      intro: 'necesitamos que confirmes o canceles tu turno para reservar correctamente el horario.',
      patient_name: data.patient_name,
      medic_name: data.medic_name,
      specialty: data.specialty,
      starts_at: data.starts_at,
      location: data.location,
      ctaText: `Elegí una opción desde los botones de abajo:${actionsHtml}`,
      footerNote: 'Si no realizás ninguna acción, el turno podría quedar sin confirmar.',
      hasApiKey: data.isInternalRequest === true,
      headerBackground: 'linear-gradient(135deg, #FFF7ED 0%, #FFE2B8 100%)',
      headerEyebrowColor: '#9A6700',
      headerTitleColor: '#7A4B00',
    }),
    text: buildAppointmentEmailText({
      title: 'Confirmación de turno',
      intro: 'necesitamos que confirmes o canceles tu turno para reservar correctamente el horario.',
      patient_name: data.patient_name,
      medic_name: data.medic_name,
      specialty: data.specialty,
      starts_at: data.starts_at,
      location: data.location,
      footerNote:
        `Confirmar: ${confirmUrl}\n` +
        `Cancelar: ${cancelUrl}\n\n` +
        'Si no realizás ninguna acción, el turno podría quedar sin confirmar.',
      hasApiKey: data.isInternalRequest === true,
    }),
  };
}

module.exports = { renderAppointmentPendingConfirmationTemplate };