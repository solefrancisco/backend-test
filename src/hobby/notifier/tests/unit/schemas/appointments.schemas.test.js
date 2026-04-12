const test = require('node:test');
const assert = require('node:assert/strict');

const { createAppointmentSchema } = require('@notify/schemas/create-appointment.schema');
const { getAppointmentByIdSchema } = require('@notify/schemas/get-appointment-by-id.schema');
const { getAppointmentsSchema } = require('@notify/schemas/get-appointments.schema');

test('createAppointmentSchema accepts valid payload', () => {
  const result = createAppointmentSchema.safeParse({
    medic_id: 1,
    patient_id: 2,
    center_id: 3,
    speciality_id: 4,
    starts_at: '2026-04-11 10:00:00',
    ends_at: '2026-04-11 11:00:00'
  });

  assert.equal(result.success, true);
});

test('createAppointmentSchema rejects when starts_at is after ends_at', () => {
  const result = createAppointmentSchema.safeParse({
    medic_id: 1,
    patient_id: 2,
    center_id: 3,
    speciality_id: 4,
    starts_at: '2026-04-11 12:00:00',
    ends_at: '2026-04-11 11:00:00'
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join('.'), 'starts_at');
  assert.equal(result.error.issues[0].message, 'starts_at must be before ends_at');
});

test('getAppointmentByIdSchema coerces id to number', () => {
  const result = getAppointmentByIdSchema.safeParse({ id: '25' });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { id: 25 });
});

test('getAppointmentsSchema accepts valid query and defaults page to 1', () => {
  const result = getAppointmentsSchema.safeParse({
    since: '2026-04-01 00:00:00',
    until: '2026-04-15 00:00:00'
  });

  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
});

test('getAppointmentsSchema rejects when since is not before until', () => {
  const result = getAppointmentsSchema.safeParse({
    since: '2026-04-15 00:00:00',
    until: '2026-04-01 00:00:00',
    page: 1
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'since' && issue.message === 'since must be before until'));
});

test('getAppointmentsSchema rejects ranges greater than one month', () => {
  const result = getAppointmentsSchema.safeParse({
    since: '2026-01-01 00:00:00',
    until: '2026-02-15 00:00:00',
    page: 1
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'until' && issue.message === 'the difference between since and until must not be greater than 1 month'));
});
