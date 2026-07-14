const test = require('node:test');
const assert = require('node:assert/strict');

const { MedicsService } = require('@apps2/services/medics.service');

test('getMedics returns cached medics wrapped in data', () => {
    const service = new MedicsService(null, []);
    service.medicsCache = [
        {
            fullname: 'Valentina Molina',
            email: 'valentina@example.com',
            speciality_id: 67,
            speciality_name: 'Cirugia Ginecologica',
        },
    ];

    assert.deepEqual(service.getMedics(), {
        data: service.medicsCache,
    });
});

test('getMedics filters cached medics by speciality_id', () => {
    const service = new MedicsService(null, []);
    service.medicsCache = [
        {
            fullname: 'Valentina Molina',
            email: 'valentina@example.com',
            speciality_id: 67,
            speciality_name: 'Cirugia Ginecologica',
        },
        {
            fullname: 'Martin Perez',
            email: 'martin@example.com',
            speciality_id: 1,
            speciality_name: 'Cardiologia',
        },
    ];

    assert.deepEqual(service.getMedics({ speciality_id: 67 }), {
        data: [service.medicsCache[0]],
    });
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
            fullname: 'Name85 Last85',
            email: 'medic85@example.com',
            speciality_id: 95,
            speciality_name: 'Speciality 85',
        },
        {
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
