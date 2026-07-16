const test = require('node:test');
const assert = require('node:assert/strict');

const { BadRequestError } = require('@apps2/errors/bad-request.error');
const { NotFoundError } = require('@apps2/errors/not-found.error');
const { MedicsService } = require('@apps2/services/medics.service');

function createCoreUser(
    id,
    firstName = 'Mateo001',
    lastName = 'SanchezMedico001',
    specialities = [{ id: 1, name: 'Cardiologia' }]
) {
    return {
        id,
        first_name: firstName,
        last_name: lastName,
        email: `medic${id}@example.com`,
        specialities,
    };
}

test('refreshMedicsCache reads ids from repository and hydrates them from Core', async () => {
    const requestedIds = [];
    const service = new MedicsService({
        async findAllIds() {
            return {
                success: true,
                data: [{ medic_id: 85 }, { medic_id: 86 }],
            };
        },
    }, {
        async getAccessToken() {
            return 'core-token';
        },
        async getUserById(id) {
            requestedIds.push(id);
            return {
                success: true,
                status: 200,
                data: id === 85
                    ? createCoreUser(id, 'Mateo001', 'SanchezMedico001', [
                        { id: 1, name: 'Cardiologia' },
                        { id: 2, name: 'Traumatologia' },
                    ])
                    : createCoreUser(id),
            };
        },
    });

    const medics = await service.refreshMedicsCache();

    assert.deepEqual(requestedIds.sort((a, b) => a - b), [85, 86]);
    assert.deepEqual(medics, [
        {
            medic_id: 85,
            fullname: 'Mateo Sanchez',
            email: 'medic85@example.com',
            speciality_id: 1,
            speciality_name: 'Cardiologia',
        },
        {
            medic_id: 85,
            fullname: 'Mateo Sanchez',
            email: 'medic85@example.com',
            speciality_id: 2,
            speciality_name: 'Traumatologia',
        },
        {
            medic_id: 86,
            fullname: 'Mateo Sanchez',
            email: 'medic86@example.com',
            speciality_id: 1,
            speciality_name: 'Cardiologia',
        },
    ]);
});

test('getMedics returns hydrated cache and filters by speciality_id', async () => {
    const service = new MedicsService({}, null);
    service.medicsCache = [
        {
            medic_id: 85,
            fullname: 'Mateo Sanchez',
            email: 'medic85@example.com',
            speciality_id: 1,
            speciality_name: 'Cardiologia',
        },
        {
            medic_id: 214,
            fullname: 'Valentina Molina',
            email: 'medic214@example.com',
            speciality_id: 67,
            speciality_name: 'Cirugia Ginecologica',
        },
    ];

    assert.deepEqual(await service.getMedics({ speciality_id: 67 }), [service.medicsCache[1]]);
    assert.deepEqual(await service.getMedics(), service.medicsCache);
});

test('createMedic saves only id and hydrates only the new medic from Core', async () => {
    const savedIds = [];
    const requestedIds = [];
    const requestedCoreSpecialityIds = [];
    const requestedLocalSpecialityIds = [];
    const service = new MedicsService({
        async findById() {
            return { success: true, data: null };
        },
        async saveId(medicId) {
            savedIds.push(medicId);
            return { success: true, data: { medic_id: medicId } };
        },
    }, {
        async getSpecialityById(id) {
            requestedCoreSpecialityIds.push(id);
            return {
                success: true,
                status: 200,
                data: { id, name: 'Cardiologia' },
            };
        },
        async getUserById(id) {
            requestedIds.push(id);
            return {
                success: true,
                status: 200,
                data: createCoreUser(id, 'Valentina130', 'MolinaMedico130', [
                    { id: 1, name: 'Cardiologia' },
                    { id: 67, name: 'Cirugia Ginecologica' },
                ]),
            };
        },
    }, {
        async getSpecialityById(id) {
            requestedLocalSpecialityIds.push(id);
            return { id, name: 'Cardiologia' };
        },
    });
    service.medicsCache = [
        {
            medic_id: 85,
            fullname: 'Mateo Sanchez',
            email: 'medic85@example.com',
            speciality_id: 1,
            speciality_name: 'Cardiologia',
        },
    ];

    const medics = await service.createMedic({ medic_id: 214, speciality_id: 1 });

    assert.deepEqual(savedIds, [214]);
    assert.deepEqual(requestedLocalSpecialityIds, [1]);
    assert.deepEqual(requestedCoreSpecialityIds, [1]);
    assert.deepEqual(requestedIds, [214]);
    assert.deepEqual(medics, [
        {
            medic_id: 214,
            fullname: 'Valentina Molina',
            email: 'medic214@example.com',
            speciality_id: 1,
            speciality_name: 'Cardiologia',
        },
        {
            medic_id: 214,
            fullname: 'Valentina Molina',
            email: 'medic214@example.com',
            speciality_id: 67,
            speciality_name: 'Cirugia Ginecologica',
        },
    ]);
    assert.deepEqual(service.medicsCache.map(item => `${item.medic_id}:${item.speciality_id}`), ['85:1', '214:1', '214:67']);
});

test('createMedic throws BadRequestError when medic id is already cached', async () => {
    const savedIds = [];
    const service = new MedicsService({
        async findById(medicId) {
            return { success: true, data: { medic_id: medicId } };
        },
        async saveId(medicId) {
            savedIds.push(medicId);
            return { success: true, data: { medic_id: medicId } };
        },
    }, {
        async getSpecialityById() {
            throw new Error('Core speciality should not be requested');
        },
        async getUserById() {
            throw new Error('Core user should not be requested');
        },
    }, {
        async getSpecialityById() {
            throw new Error('Local speciality should not be requested');
        },
    });

    await assert.rejects(
        () => service.createMedic({ medic_id: 214, speciality_id: 1 }),
        BadRequestError
    );
    assert.deepEqual(savedIds, []);
});

test('createMedic throws BadRequestError when local speciality does not exist', async () => {
    const savedIds = [];
    const service = new MedicsService({
        async findById() {
            return { success: true, data: null };
        },
        async saveId(medicId) {
            savedIds.push(medicId);
            return { success: true, data: { medic_id: medicId } };
        },
    }, {
        async getSpecialityById() {
            throw new Error('Core speciality should not be requested');
        },
        async getUserById() {
            throw new Error('Core user should not be requested');
        },
    }, {
        async getSpecialityById(id) {
            throw new NotFoundError(`Speciality id ${id} not found`);
        },
    });

    await assert.rejects(
        () => service.createMedic({ medic_id: 214, speciality_id: 999 }),
        BadRequestError
    );
    assert.deepEqual(savedIds, []);
});

test('createMedic throws BadRequestError when Core speciality does not exist', async () => {
    const savedIds = [];
    const service = new MedicsService({
        async findById() {
            return { success: true, data: null };
        },
        async saveId(medicId) {
            savedIds.push(medicId);
            return { success: true, data: { medic_id: medicId } };
        },
    }, {
        async getSpecialityById() {
            return { success: false, status: 404 };
        },
        async getUserById() {
            throw new Error('Core user should not be requested');
        },
    }, {
        async getSpecialityById(id) {
            return { id, name: 'Cardiologia' };
        },
    });

    await assert.rejects(
        () => service.createMedic({ medic_id: 214, speciality_id: 999 }),
        BadRequestError
    );
    assert.deepEqual(savedIds, []);
});
