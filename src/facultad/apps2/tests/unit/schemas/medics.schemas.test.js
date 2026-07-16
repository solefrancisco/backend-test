const test = require('node:test');
const assert = require('node:assert/strict');

const { createMedicSchema } = require('@apps2/schemas/medics/create-medic.schema');

test('createMedicSchema requires medic_id and speciality_id', () => {
    const result = createMedicSchema.safeParse({
        medic_id: 214,
        speciality_id: 1,
    });

    assert.equal(result.success, true);
    assert.deepEqual(result.data, {
        medic_id: 214,
        speciality_id: 1,
    });
});

test('createMedicSchema rejects missing speciality_id', () => {
    const result = createMedicSchema.safeParse({
        medic_id: 214,
    });

    assert.equal(result.success, false);
});
