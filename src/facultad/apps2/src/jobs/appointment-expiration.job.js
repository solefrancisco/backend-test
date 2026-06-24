class AppointmentExpirationJob {
  constructor(appointmentsService, config) {
    this.appointmentsService = appointmentsService;
    this.intervalMs = config.intervalMs;
    this.timer = null;
    this.isRunning = false;
  }

  start() {
    this.timer = setInterval(() => this.run(), this.intervalMs);
    this.run(); 
  }

  async run() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const result = await this.appointmentsService.expirePendingAppointments();
    } catch (error) {
      console.error('Failed to expire pending appointments', error);
    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

module.exports = { AppointmentExpirationJob };