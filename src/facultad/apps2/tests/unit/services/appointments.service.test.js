const test = require('node:test');
const assert = require('node:assert/strict');
const { env } = require('@apps2/configs/env.config');

const { AppointmentsService } = require('@apps2/services/appointments.service');
const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { NotFoundError } = require('@apps2/errors/not-found.error');
const { InternalServerError } = require('@apps2/errors/internal-server.error');

test('createAppointment throws BadRequestError when starts_at is in the past', async () => {
  const repository = {
    create: async () => ({ success: true, data: 1 })
  };
  const service = new AppointmentsService(repository);

  await assert.rejects(
    () => service.createAppointment({
      medic_id: 1,
      patient_id: 1,
      center_id: 1,
      speciality_id: 1,
      starts_at: '2000-01-01 10:00:00',
      ends_at: '2000-01-01 11:00:00'
    }),
    (error) => {
      assert.ok(error instanceof BadRequestError);
      assert.equal(error.message, 'Cannot create appointment in the past');
      return true;
    }
  );
});

test('createAppointment returns appointment_id when repository succeeds', async () => {
  const repository = {
    create: async (data) => ({ success: true, data: 123, received: data })
  };
  const service = new AppointmentsService(repository);

  const result = await service.createAppointment({
    medic_id: 1,
    patient_id: 2,
    center_id: 3,
    speciality_id: 4,
    starts_at: '2099-01-01 10:00:00',
    ends_at: '2099-01-01 11:00:00'
  });

  assert.deepEqual(result, { appointment_id: 123 });
});

test('createAppointment maps sqlState 45000 to BadRequestError', async () => {
  const repository = {
    create: async () => ({ success: false, sqlState: '45000' })
  };
  const service = new AppointmentsService(repository);

  await assert.rejects(
    () => service.createAppointment({
      medic_id: 1,
      patient_id: 2,
      center_id: 3,
      speciality_id: 4,
      starts_at: '2099-01-01 10:00:00',
      ends_at: '2099-01-01 11:00:00'
    }),
    (error) => {
      assert.ok(error instanceof BadRequestError);
      assert.match(error.message, /Scheduling conflict/);
      return true;
    }
  );
});

test('createAppointment maps other repository errors to InternalServerError', async () => {
  const repository = {
    create: async () => ({ success: false, sqlState: 'HY000' })
  };
  const service = new AppointmentsService(repository);

  await assert.rejects(
    () => service.createAppointment({
      medic_id: 1,
      patient_id: 2,
      center_id: 3,
      speciality_id: 4,
      starts_at: '2099-01-01 10:00:00',
      ends_at: '2099-01-01 11:00:00'
    }),
    (error) => {
      assert.ok(error instanceof InternalServerError);
      assert.equal(error.message, 'Failed to create appointment: HY000');
      return true;
    }
  );
});

test('getAppointments returns repository data when successful', async () => {
  const rows = [{ id: 1 }, { id: 2 }];
  const repository = {
    findAll: async (limit, query) => {
      assert.equal(limit, env.paginationDefaultPageSize);
      assert.deepEqual(query, {
        since: '2026-04-01 00:00:00',
        until: '2026-04-02 00:00:00',
        page: 2
      });
      return { success: true, data: rows };
    }
  };
  const service = new AppointmentsService(repository);

  const result = await service.getAppointments({
    since: '2026-04-01 00:00:00',
    until: '2026-04-02 00:00:00',
    page: 2
  });

  assert.deepEqual(result, rows);
});

test('getAppointments throws InternalServerError when repository fails', async () => {
  const repository = {
    findAll: async () => ({ success: false, sqlState: 'db down' })
  };
  const service = new AppointmentsService(repository);

  await assert.rejects(
    () => service.getAppointments({ since: '2026-04-01 00:00:00', until: '2026-04-02 00:00:00', page: 1 }),
    (error) => {
      assert.ok(error instanceof InternalServerError);
      assert.equal(error.message, 'Failed to retrieve appointments: db down');
      return true;
    }
  );
});

test('getAppointmentById returns appointment with nested related data', async () => {
  const appointment = {
    id: 55,
    medic_id: 1,
    patient_id: 2,
    center_id: 3,
    speciality_id: 4,
    status: 'CONFIRMED',
    starts_at: '2099-01-01 10:00:00',
    ends_at: '2099-01-01 10:30:00',
    confirmed_at: null,
    absent_at: null,
    expired_at: null,
    checked_in_at: null,
    cancelled_at: null,
    completed_at: null,
    started_at: null,
    created_at: '2099-01-01 09:00:00'
  };
  const repository = {
    findById: async (id) => {
      assert.equal(id, 55);
      return { success: true, data: appointment };
    }
  };
  const medicalCentersService = {
    getMedicalCentersById: async (id) => {
      assert.equal(id, 3);
      return { id: 3, name: 'Central' };
    }
  };
  const specialitiesService = {
    getSpecialityById: async (id) => {
      assert.equal(id, 4);
      return { id: 4, name: 'Cardiologia Local', is_high_complexity: 1 };
    }
  };
  const coreClient = {
    getUserById: async (id) => ({
      success: true,
      data: id === 1
        ? { id: 1, first_name: 'Mateo001', last_name: 'SanchezMedico001', email: 'medic@example.com' }
        : { id: 2, first_name: 'Mateo001', last_name: 'SanchezPaciente001', email: 'patient@example.com' }
    }),
    getSpecialityById: async (id) => {
      assert.equal(id, 4);
      return { success: true, data: { id: 4, name: 'Cardiologia', is_high_complexity: 0 } };
    }
  };
  const service = new AppointmentsService(repository, null, null, specialitiesService, medicalCentersService, coreClient);

  const result = await service.getAppointmentById(55);

  assert.equal(result.id, 55);
  assert.deepEqual(result.patient, {
    id: 2,
    fullname: 'Mateo Sanchez',
    email: 'patient@example.com'
  });
  assert.deepEqual(result.medic, {
    id: 1,
    fullname: 'Mateo Sanchez',
    email: 'medic@example.com'
  });
  assert.deepEqual(result.speciality, {
    id: 4,
    name: 'Cardiologia',
    is_high_complexity: 1
  });
  assert.deepEqual(result.medical_center, {
    id: 3,
    name: 'Central'
  });
  assert.equal(result.patient_id, undefined);
  assert.equal(result.medic_id, undefined);
  assert.equal(result.speciality_id, undefined);
  assert.equal(result.center_id, undefined);
});

test('getAppointmentById throws NotFoundError when repository returns null', async () => {
  const repository = {
    findById: async () => ({ success: true, data: null })
  };
  const service = new AppointmentsService(repository);

  await assert.rejects(
    () => service.getAppointmentById(99),
    (error) => {
      assert.ok(error instanceof NotFoundError);
      assert.equal(error.message, 'Appointment id 99 not found');
      return true;
    }
  );
});

test('getAppointmentById throws InternalServerError when repository fails', async () => {
  const repository = {
    findById: async () => ({ success: false, sqlState: 'query error' })
  };
  const service = new AppointmentsService(repository);

  await assert.rejects(
    () => service.getAppointmentById(1),
    (error) => {
      assert.ok(error instanceof InternalServerError);
      assert.equal(error.message, 'Failed to find appointment: query error');
      return true;
    }
  );
});

test('publishCoreWebhookEvents skips check-in Core event when event type id is not configured', async () => {
  let publishEventCalled = false;
  const repository = {};
  const coreClient = {
    publishEvent: async () => {
      publishEventCalled = true;
      return { success: true };
    }
  };
  const service = new AppointmentsService(repository, null, null, null, null, coreClient);
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (message) => warnings.push(message);

  try {
    await service.publishCoreWebhookEvents(17, [
      {
        notify_by: 'webhook',
        notification_type: 'webhookCheckIn',
        appointmentId: 17,
        metadata: { patient_id: 1, medic_id: 2 },
        reason: 'El paciente hizo checkin',
      }
    ], 'request-123');
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(publishEventCalled, false);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /module1CheckIn/);
  assert.match(warnings[0], /APPS2_CORE_EVENT_MODULE1_CHECK_IN_ID/);
});
