const test = require('node:test');
const assert = require('node:assert/strict');

const { MySqlMedicsRepository } = require('@apps2/repositories/medics.repository');

test('findAllIds reads only cached Core user ids', async () => {
    let capturedSql;
    const repository = new MySqlMedicsRepository({
        async query(sql) {
            capturedSql = sql;
            return [[{ medic_id: 85 }, { medic_id: 214 }]];
        },
    });

    const result = await repository.findAllIds();

    assert.equal(result.success, true);
    assert.match(capturedSql, /SELECT\s+core_user_id AS medic_id\s+FROM cached_medics\s+ORDER BY core_user_id ASC/s);
    assert.deepEqual(result.data, [{ medic_id: 85 }, { medic_id: 214 }]);
});

test('saveId inserts only core_user_id', async () => {
    let capturedSql;
    let capturedValues;
    const repository = new MySqlMedicsRepository({
        async query(sql, values) {
            capturedSql = sql;
            capturedValues = values;
            return [[]];
        },
    });

    const result = await repository.saveId(214);

    assert.equal(result.success, true);
    assert.match(capturedSql, /INSERT INTO cached_medics \(core_user_id\)/);
    assert.doesNotMatch(capturedSql, /ON DUPLICATE KEY UPDATE/);
    assert.deepEqual(capturedValues, [214]);
    assert.deepEqual(result.data, { medic_id: 214 });
});

test('findById reads one cached Core user id', async () => {
    let capturedSql;
    let capturedValues;
    const repository = new MySqlMedicsRepository({
        async query(sql, values) {
            capturedSql = sql;
            capturedValues = values;
            return [[{ medic_id: 214 }]];
        },
    });

    const result = await repository.findById(214);

    assert.equal(result.success, true);
    assert.match(capturedSql, /WHERE core_user_id = \?/);
    assert.deepEqual(capturedValues, [214]);
    assert.deepEqual(result.data, { medic_id: 214 });
});
