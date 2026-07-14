const test = require('node:test');
const assert = require('node:assert/strict');

const { MedicsService } = require('@apps2/services/medics.service');

test('getMedics returns cached medics as a list', () => {
    const service = new MedicsService(null, []);
    service.medicsCache = [
        {
            medic_id: 214,
            fullname: 'Valentina Molina',
            email: 'valentina@example.com',
            speciality_id: 67,
            speciality_name: 'Cirugia Ginecologica',
        },
    ];

    assert.deepEqual(service.getMedics(), service.medicsCache);
});

test('getMedics filters cached medics by speciality_id', () => {
    const service = new MedicsService(null, []);
    service.medicsCache = [
        {
            medic_id: 214,
            fullname: 'Valentina Molina',
            email: 'valentina@example.com',
            speciality_id: 67,
            speciality_name: 'Cirugia Ginecologica',
        },
        {
            medic_id: 85,
            fullname: 'Martin Perez',
            email: 'martin@example.com',
            speciality_id: 1,
            speciality_name: 'Cardiologia',
        },
    ];

    assert.deepEqual(service.getMedics({ speciality_id: 67 }), [service.medicsCache[0]]);
});

test('refreshMedicsCache fetches users from Core and maps them into cached medics', async () => {
    const requestedIds = [];
    const coreClient = {
        async getAccessToken() {
            return 'core-token';
        },
        async getUserById(id) {
            requestedIds.push(id);
            return {
                success: true,
                status: 200,
                data: {
                    id,
                    first_name: `Name${id}`,
                    last_name: `Last${id}`,
                    email: `medic${id}@example.com`,
                    specialities: [
                        {
                            id: id + 10,
                            name: `Speciality ${id}`,
                        },
                    ],
                },
            };
        },
    };
    const service = new MedicsService(coreClient, [85, 86]);

    const cache = await service.refreshMedicsCache();

    assert.deepEqual(requestedIds.sort((a, b) => a - b), [85, 86]);
    assert.deepEqual(cache, [
        {
            medic_id: 85,
            fullname: 'Name85 Last85',
            email: 'medic85@example.com',
            speciality_id: 95,
            speciality_name: 'Speciality 85',
        },
        {
            medic_id: 86,
            fullname: 'Name86 Last86',
            email: 'medic86@example.com',
            speciality_id: 96,
            speciality_name: 'Speciality 86',
        },
    ]);
});

test('refreshMedicsCache skips invalid Core user payloads', async () => {
    const coreClient = {
        async getAccessToken() {
            return 'core-token';
        },
        async getUserById() {
            return {
                success: true,
                status: 200,
                data: { raw: '502 Bad Gateway' },
            };
        },
    };
    const service = new MedicsService(coreClient, [85]);

    const cache = await service.refreshMedicsCache();

    assert.deepEqual(cache, []);
});

test('formatCoreResponseForLog flattens raw Core responses', () => {
    const service = new MedicsService(null, []);

    assert.equal(
        service.formatCoreResponseForLog({ raw: '502\nBad Gateway' }),
        '502 Bad Gateway'
    );
});
