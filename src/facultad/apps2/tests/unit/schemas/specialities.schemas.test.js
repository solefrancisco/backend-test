const test = require('node:test');
const assert = require('node:assert/strict');

const { createSpecialitySchema } = require('@apps2/schemas/specialities/create-speciality.schema');

test('createSpecialitySchema accepts valid speciality payload', () => {
  const result = createSpecialitySchema.safeParse({
    speciality_id: 77,
    name: 'Cardiologia',
    is_high_complexity: 0,
    type: 'CONSULTATION',
  });

  assert.equal(result.success, true);
  assert.equal(result.data.speciality_id, 77);
});

test('createSpecialitySchema rejects invalid type and high complexity flag', () => {
  const result = createSpecialitySchema.safeParse({
    name: 'Cardiologia',
    is_high_complexity: 2,
    type: 'OTHER',
  });

  assert.equal(result.success, false);
  assert.deepEqual(
    result.error.issues.map((issue) => issue.path.join('.')),
    ['is_high_complexity', 'type']
  );
});
