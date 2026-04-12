const test = require('node:test');
const assert = require('node:assert/strict');

const { AppointmentsController } = require('@notify/controllers/appointments.controller');

function createResponseMock() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('createAppointment responds with 201 and appointment payload', async () => {
  const expected = { appointment_id: 123 };
  const controller = new AppointmentsController({
    createAppointment: async (data) => {
      assert.deepEqual(data, { medic_id: 1 });
      return expected;
    }
  });

  const req = { body: { medic_id: 1 } };
  const res = createResponseMock();
  let nextCalled = false;

  await controller.createAppointment(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, expected);
  assert.equal(nextCalled, false);
});

test('createAppointment delegates errors to next', async () => {
  const error = new Error('boom');
  const controller = new AppointmentsController({
    createAppointment: async () => {
      throw error;
    }
  });

  const req = { body: {} };
  const res = createResponseMock();
  let receivedError;

  await controller.createAppointment(req, res, (err) => {
    receivedError = err;
  });

  assert.equal(receivedError, error);
});

test('getAppointments responds with 200 and appointments payload', async () => {
  const expected = [{ id: 1 }];
  const controller = new AppointmentsController({
    getAppointments: async (query) => {
      assert.deepEqual(query, { page: 2 });
      return expected;
    }
  });

  const req = { query: { page: 2 } };
  const res = createResponseMock();

  await controller.getAppointments(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, expected);
});

test('getAppointments delegates errors to next', async () => {
  const error = new Error('list error');
  const controller = new AppointmentsController({
    getAppointments: async () => {
      throw error;
    }
  });

  let receivedError;
  await controller.getAppointments({ query: {} }, createResponseMock(), (err) => {
    receivedError = err;
  });

  assert.equal(receivedError, error);
});

test('getAppointmentById responds with 200 and appointment payload', async () => {
  const expected = { id: 77 };
  const controller = new AppointmentsController({
    getAppointmentById: async (id) => {
      assert.equal(id, '77');
      return expected;
    }
  });

  const req = { params: { id: '77' } };
  const res = createResponseMock();

  await controller.getAppointmentById(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, expected);
});

test('getAppointmentById delegates errors to next', async () => {
  const error = new Error('get by id error');
  const controller = new AppointmentsController({
    getAppointmentById: async () => {
      throw error;
    }
  });

  let receivedError;
  await controller.getAppointmentById({ params: { id: '1' } }, createResponseMock(), (err) => {
    receivedError = err;
  });

  assert.equal(receivedError, error);
});
