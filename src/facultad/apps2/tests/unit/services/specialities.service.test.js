const test = require('node:test');
const assert = require('node:assert/strict');

const { SpecialitiesService } = require('@apps2/services/specialities.service');
const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { InternalServerError } = require('@apps2/errors/internal-server.error');

test('createSpeciality returns created speciality from repository', async () => {
  const expected = {
    id: 77,
    name: 'Cardiologia',
    is_high_complexity: 0,
    type: 'CONSULTATION',
  };
  const service = new SpecialitiesService({
    async findByName(name) {
      assert.equal(name, 'Cardiologia');
      return { success: true, data: null };
    },
    async create(data) {
      assert.deepEqual(data, {
        speciality_id: 77,
        name: 'Cardiologia',
        is_high_complexity: 0,
        type: 'CONSULTATION',
      });
      return { success: true, data: expected };
    },
  });

  const speciality = await service.createSpeciality({
    speciality_id: 77,
    name: 'Cardiologia',
    is_high_complexity: 0,
    type: 'CONSULTATION',
  });

  assert.deepEqual(speciality, expected);
});

test('createSpeciality throws InternalServerError when repository fails', async () => {
  const service = new SpecialitiesService({
    async findByName() {
      return { success: true, data: null };
    },
    async create() {
      return { success: false, errorMessage: 'insert failed' };
    },
  });

  await assert.rejects(
    () => service.createSpeciality({
      name: 'Cardiologia',
      is_high_complexity: 0,
      type: 'CONSULTATION',
    }),
    InternalServerError
  );
});

test('createSpeciality throws BadRequestError when speciality already exists', async () => {
  const service = new SpecialitiesService({
    async findByName(name) {
      assert.equal(name, 'Cardiologia');
      return {
        success: true,
        data: {
          id: 1,
          name: 'Cardiologia',
          is_high_complexity: 0,
          type: 'CONSULTATION',
        },
      };
    },
    async create() {
      throw new Error('create should not be called');
    },
  });

  await assert.rejects(
    () => service.createSpeciality({
      name: 'Cardiologia',
      is_high_complexity: 0,
      type: 'CONSULTATION',
    }),
    BadRequestError
  );
});

test('createSpeciality throws InternalServerError when duplicate validation fails', async () => {
  const service = new SpecialitiesService({
    async findByName() {
      return { success: false, errorMessage: 'query failed' };
    },
  });

  await assert.rejects(
    () => service.createSpeciality({
      name: 'Cardiologia',
      is_high_complexity: 0,
      type: 'CONSULTATION',
    }),
    InternalServerError
  );
});
