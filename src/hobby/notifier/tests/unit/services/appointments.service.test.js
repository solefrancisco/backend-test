const test = require('node:test');
const assert = require('node:assert/strict');
const { env } = require('@notify/configs/env.config');

const { AppointmentsService } = require('@notify/services/appointments.service');
const { BadRequestError } = require('@notify/errors/bad-request.error');
const { NotFoundError } = require('@notify/errors/not-found.error');
const { InternalServerError } = require('@notify/errors/internal-server.error');

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

test('getAppointmentById returns appointment when repository finds it', async () => {
  const appointment = { id: 55, status: 'CONFIRMED' };
  const repository = {
    findById: async (id) => {
      assert.equal(id, 55);
      return { success: true, data: appointment };
    }
  };
  const service = new AppointmentsService(repository);

  const result = await service.getAppointmentById(55);

  assert.deepEqual(result, appointment);
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
