const { buildAppointmentsController } = require('@apps2/bootstrap/appointments.bootstrap');
const { env } = require('@apps2/configs/env.config');

async function buildDependencies() {
    const dependencies = {};
    
    if (env.appointmentsEnabled) {
        dependencies.appointmentsController = buildAppointmentsController();
    }
    
    return dependencies;
}


module.exports = { buildDependencies };