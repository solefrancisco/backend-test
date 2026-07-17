const test = require('node:test');
const assert = require('node:assert/strict');

const {
  generateOperationsRoomWebhookNotification,
  generateOperationsRoomCreateWebhookNotification,
  generateHighComplexityWebhookNotification,
} = require('@apps2/integrations/notifications/appointments-notification.mapper');

const notificationData = {
  appointment: {
    starts_at: '2029-09-05 16:00:00',
    ends_at: '2029-09-05 16:30:00',
    center_id: 4,
    speciality_id: 8,
    speciality_name: 'Cirugia Ginecologica',
    medical_center_name: 'Centro medico 4',
  },
  patient: {
    id: 101,
    fullname: 'Paciente Demo',
    email: 'patient@example.com',
  },
  medic: {
    id: 202,
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

test('generateOperationsRoomCreateWebhookNotification maps appointment data for module 6', () => {
  const previousCreateUrl = process.env.OPERATING_ROOM_CREATE_WEBHOOK_URL;
  process.env.OPERATING_ROOM_CREATE_WEBHOOK_URL = 'https://example.com/api/v1/turnos';

  try {
    const notification = generateOperationsRoomCreateWebhookNotification(
      notificationData,
      21,
      undefined,
      'webhook',
      {},
      'request-create'
    );

    assert.equal(notification.request.url, 'https://example.com/api/v1/turnos');
    assert.equal(notification.request.method, 'POST');
    assert.deepEqual(notification.request.headers, { 'Content-Type': 'application/json' });
    assert.deepEqual(
      Object.keys(notification.request.body),
      [
        'turno_id',
        'paciente_id',
        'medico_cirujano_id',
        'fecha_hora_inicio',
        'fecha_hora_fin_estimada',
        'prioridad',
        'hospital_id',
        'specialty_id',
        'observaciones'
      ]
    );
    assert.equal(notification.request.body.turno_id, 21);
    assert.equal(notification.request.body.paciente_id, 101);
    assert.equal(notification.request.body.medico_cirujano_id, 202);
    assert.equal(notification.request.body.fecha_hora_inicio, '2029-09-05 16:00:00');
    assert.equal(notification.request.body.fecha_hora_fin_estimada, '2029-09-05 16:30:00');
    assert.match(notification.request.body.prioridad, /^(BAJA|ALTA|MUY_ALTA)$/);
    assert.equal(notification.request.body.hospital_id, '4');
    assert.equal(notification.request.body.specialty_id, 8);
    assert.equal(notification.request.body.observaciones, 'webhook');
  } finally {
    if (previousCreateUrl) {
      process.env.OPERATING_ROOM_CREATE_WEBHOOK_URL = previousCreateUrl;
    } else {
      delete process.env.OPERATING_ROOM_CREATE_WEBHOOK_URL;
    }
  }
});

test('generateOperationsRoomCreateWebhookNotification uses reschedule metadata when present', () => {
  const notification = generateOperationsRoomCreateWebhookNotification(
    notificationData,
    21,
    undefined,
    'Turno quirurgico reprogramado',
    {
      center_id: 6,
      medic_id: 303,
      patient_id: 404,
      new_starts_at: '2029-09-06 10:00:00',
      new_ends_at: '2029-09-06 10:30:00',
    },
    'request-reschedule'
  );

  assert.equal(notification.request.url, 'https://modulo-6-api.hf.space/api/v1/quirofanos/reservas');
  assert.equal(notification.request.body.paciente_id, 404);
  assert.equal(notification.request.body.medico_cirujano_id, 303);
  assert.equal(notification.request.body.fecha_hora_inicio, '2029-09-06 10:00:00');
  assert.equal(notification.request.body.fecha_hora_fin_estimada, '2029-09-06 10:30:00');
  assert.equal(notification.request.body.hospital_id, '6');
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
