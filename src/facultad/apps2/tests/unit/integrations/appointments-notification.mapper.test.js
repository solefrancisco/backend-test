const test = require('node:test');
const assert = require('node:assert/strict');

const {
  generateOperationsRoomWebhookNotification,
  generateHighComplexityWebhookNotification,
} = require('@apps2/integrations/notifications/appointments-notification.mapper');

const notificationData = {
  appointment: {
    starts_at: '2029-09-05 16:00:00',
    speciality_name: 'Cirugia Ginecologica',
    medical_center_name: 'Centro medico 4',
  },
  patient: {
    fullname: 'Paciente Demo',
    email: 'patient@example.com',
  },
  medic: {
    fullname: 'Medico Demo',
    email: 'medic@example.com',
  },
};

test('generateOperationsRoomWebhookNotification uses operations room fallback URL when env is missing', () => {
  const previousUrl = process.env.OPERATING_ROOM_WEBHOOK_URL;
  delete process.env.OPERATING_ROOM_WEBHOOK_URL;

  try {
    const notification = generateOperationsRoomWebhookNotification(
      notificationData,
      21,
      undefined,
      'Turno quirurgico cancelado',
      {},
      'request-123'
    );

    assert.equal(notification.request.url, 'https://modulo-6-api.hf.space/api/v1/turnos/21/cancelacion');
    assert.equal(notification.request.body.motivo, 'Turno quirurgico cancelado');
    assert.equal(notification.request.body.tipo_notificacion, 'Turno quirurgico cancelado');
    assert.equal(typeof notification.request.body.timestamp, 'string');
  } finally {
    if (previousUrl) {
      process.env.OPERATING_ROOM_WEBHOOK_URL = previousUrl;
    } else {
      delete process.env.OPERATING_ROOM_WEBHOOK_URL;
    }
  }
});

test('generateOperationsRoomWebhookNotification includes reschedule metadata without appointment nesting', () => {
  const notification = generateOperationsRoomWebhookNotification(
    notificationData,
    21,
    undefined,
    'Turno quirurgico reprogramado',
    {
      previous_starts_at: '2029-09-05 16:00:00',
      previous_ends_at: '2029-09-05 16:30:00',
      new_starts_at: '2029-09-06 10:00:00',
      new_ends_at: '2029-09-06 10:30:00',
    },
    'request-789'
  );

  assert.equal(notification.request.body.previous_starts_at, '2029-09-05 16:00:00');
  assert.equal(notification.request.body.previous_ends_at, '2029-09-05 16:30:00');
  assert.equal(notification.request.body.new_starts_at, '2029-09-06 10:00:00');
  assert.equal(notification.request.body.new_ends_at, '2029-09-06 10:30:00');
  assert.equal(notification.request.body.appointment, undefined);
});

test('generateHighComplexityWebhookNotification keeps high complexity URL separate from operations room URL', () => {
  const previousHighComplexityUrl = process.env.HIGH_COMPLEXITY_WEBHOOK_URL;
  const previousOperationsRoomUrl = process.env.OPERATING_ROOM_WEBHOOK_URL;
  process.env.HIGH_COMPLEXITY_WEBHOOK_URL = 'https://health-grid-backend-7l67.onrender.com/api/events/webhook';
  process.env.OPERATING_ROOM_WEBHOOK_URL = 'https://example.com/operations-room';

  try {
    const notification = generateHighComplexityWebhookNotification(
      notificationData,
      21,
      undefined,
      'Turno de alta complejidad cancelado',
      {},
      'request-456'
    );

    assert.equal(notification.request.url, 'https://health-grid-backend-7l67.onrender.com/api/events/webhook');
  } finally {
    if (previousHighComplexityUrl) {
      process.env.HIGH_COMPLEXITY_WEBHOOK_URL = previousHighComplexityUrl;
    } else {
      delete process.env.HIGH_COMPLEXITY_WEBHOOK_URL;
    }

    if (previousOperationsRoomUrl) {
      process.env.OPERATING_ROOM_WEBHOOK_URL = previousOperationsRoomUrl;
    } else {
      delete process.env.OPERATING_ROOM_WEBHOOK_URL;
    }
  }
});
