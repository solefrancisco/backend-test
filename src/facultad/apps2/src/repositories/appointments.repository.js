class MySqlAppointmentsRepository {
  constructor(pool) {
    this.pool = pool;
    this.buenosAiresNow = "NOW() - INTERVAL 3 HOUR";
  }

  async filter(queryFilters, query) {
    let conditions = [];
    let values = [queryFilters.since, queryFilters.until];
    let page = 1;

    if (queryFilters.patient_id) {
      conditions.push('patient_id = ?');
      values.push(queryFilters.patient_id);
    }

    if (queryFilters.medic_id) {
      conditions.push('medic_id = ?');
      values.push(queryFilters.medic_id);
    }

    if (queryFilters.medical_center_id) {
      conditions.push('center_id = ?');
      values.push(queryFilters.medical_center_id);
    }

    if(queryFilters.speciality_id) {
      conditions.push('speciality_id = ?');
      values.push(queryFilters.speciality_id);
    }
    
    query += " WHERE starts_at between ? AND ? AND status NOT IN ('EXPIRED', 'CANCELLED', 'ABSENT') ";

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    if (queryFilters.page) {
      page = Number(queryFilters.page);
    }

    return { query, conditions, values, page };
  }

  async create(data) {
    try {
      const [result] = await this.pool.query(
        `
          CALL sp_create_appointment(?, ?, ?, ?, ?, ?)
        `,
        [
          data.medic.id, 
          data.patient.id, 
          data.appointment.center_id, data.appointment.speciality_id, data.appointment.starts_at, data.appointment.ends_at
        ]
      );
      return { success: true, data: result[0][0].appointment_id };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findById(appointmentId) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT
            id,
            medic_id,
            patient_id,
            center_id,
            speciality_id,
            status,
            DATE_FORMAT(starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at,
            DATE_FORMAT(ends_at, '%Y-%m-%d %H:%i:%s') AS ends_at,
            DATE_FORMAT(expired_at, '%Y-%m-%d %H:%i:%s') AS expired_at,
            DATE_FORMAT(confirmed_at, '%Y-%m-%d %H:%i:%s') AS confirmed_at,
            DATE_FORMAT(absent_at, '%Y-%m-%d %H:%i:%s') AS absent_at,
            DATE_FORMAT(checked_in_at, '%Y-%m-%d %H:%i:%s') AS checked_in_at,
            DATE_FORMAT(cancelled_at, '%Y-%m-%d %H:%i:%s') AS cancelled_at,
            DATE_FORMAT(completed_at, '%Y-%m-%d %H:%i:%s') AS completed_at,
            DATE_FORMAT(started_at, '%Y-%m-%d %H:%i:%s') AS started_at,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
          FROM appointments
          WHERE id = ?
          LIMIT 1
        `,
        [appointmentId]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findAll(limit, queryFilters) {
    try{
      const baseQuery = `
          SELECT
            a.id,
            a.medic_id,
            a.patient_id,
            a.center_id,
            a.speciality_id,
            a.status,
            DATE_FORMAT(a.starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at,
            DATE_FORMAT(a.ends_at, '%Y-%m-%d %H:%i:%s') AS ends_at,
            DATE_FORMAT(a.confirmed_at, '%Y-%m-%d %H:%i:%s') AS confirmed_at,
            DATE_FORMAT(a.absent_at, '%Y-%m-%d %H:%i:%s') AS absent_at,
            DATE_FORMAT(a.expired_at, '%Y-%m-%d %H:%i:%s') AS expired_at,
            DATE_FORMAT(a.checked_in_at, '%Y-%m-%d %H:%i:%s') AS checked_in_at,
            DATE_FORMAT(a.cancelled_at, '%Y-%m-%d %H:%i:%s') AS cancelled_at,
            DATE_FORMAT(a.completed_at, '%Y-%m-%d %H:%i:%s') AS completed_at,
            DATE_FORMAT(a.started_at, '%Y-%m-%d %H:%i:%s') AS started_at,
            DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
          FROM appointments a
        `;
      
      let { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const offset = (page - 1) * limit;
      query += ' ORDER BY starts_at ASC, id ASC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.pool.query(
        query,
        values
      );

      return { success: true, data: rows };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async count(queryFilters) {
    try{
      const baseQuery = `
          SELECT COUNT(1) AS count 
          FROM appointments
        `;

      const { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const [rows] = await this.pool.query(
        query,
        values
      );
      return { success: true, data: rows[0].count };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async confirm(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            status = 'CONFIRMED',
            confirmed_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status = 'PENDING_CONFIRMATION';
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async checkIn(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            status = 'CHECKED_IN',
            checked_in_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status = 'CONFIRMED'
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };  
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async start(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            status = 'IN_PROGRESS',
            started_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status = 'CHECKED_IN'
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async complete(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            status = 'COMPLETED',
            completed_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status = 'IN_PROGRESS'
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async cancel(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            status = 'CANCELLED',
            cancelled_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status IN ('PENDING_CONFIRMATION', 'CONFIRMED')
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findPendingAppointmentsToExpire() {
    try{
      const [result] = await this.pool.query(
        `
          SELECT id 
          FROM appointments
          WHERE starts_at between ${this.buenosAiresNow} - interval 2 minute and ${this.buenosAiresNow}
            AND status = 'PENDING_CONFIRMATION'
            and reminded_at IS NOT NULL
        `
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async expirePendingAppointment(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            status = 'EXPIRED',
            expired_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status = 'PENDING_CONFIRMATION'
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findPendingAppointmentsToRemind() {
    try{
      const [result] = await this.pool.query(
        `
          SELECT id 
          FROM appointments
          WHERE starts_at between ${this.buenosAiresNow} - interval 1 day and ${this.buenosAiresNow} -- last day
            AND status IN ('PENDING_CONFIRMATION', 'CONFIRMED')
            AND reminded_at IS NULL
        `
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async remindPendingAppointment(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            reminded_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status IN ('PENDING_CONFIRMATION', 'CONFIRMED')
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findAppointmentsToSetAsAbsent() {
    try{
      const [result] = await this.pool.query(
        `
          SELECT id 
          FROM appointments
          WHERE starts_at between ${this.buenosAiresNow} - interval 1 day and ${this.buenosAiresNow} -- last day
            AND status = 'CONFIRMED'
            AND absent_at IS NULL
            AND reminded_at IS NOT NULL
        `
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async setAppointmentAsAbsent(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            status = 'ABSENT',
            absent_at = ${this.buenosAiresNow}
          WHERE id = ?
            AND status = 'CONFIRMED'
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async checkAvailability(queryFilters) {
    try {
      const baseQuery = `
        SELECT id
        FROM appointments
      `;

      const { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const [rows] = await this.pool.query(
        query,
        values
      );
      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async reschedule(id, data) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET
            starts_at = ?,
            ends_at = ?,
            status = 'PENDING_CONFIRMATION'
          WHERE id = ?
            AND status IN ('PENDING_CONFIRMATION', 'CONFIRMED')
        `,
        [data.starts_at, data.ends_at, id]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findOccupiedAppointments(queryFilters) {
    try {
      const baseQuery = `
          SELECT
            id,
            DATE_FORMAT(starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at
          FROM appointments
        `;

      const { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const [rows] = await this.pool.query(
        query,
        values
      );
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findMockedUsers(queryFilters) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT
            fullname,
            email
          FROM mocked_users
        `,
      );

      return { success: true, data: rows };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async delete(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          DELETE FROM appointments
          WHERE id = ?;
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

    async deleteSavedNotification(appointmentId) {
    try{
      const [result] = await this.pool.query(
        `
          DELETE FROM appointments_notifications
          WHERE id = ?;
        `,
        [appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async rollbackStatusChange(appointmentId, originalStatus) {
    try{
      const [result] = await this.pool.query(
        `
          UPDATE appointments
          SET status = ?
          WHERE id = ?
        `,
        [originalStatus, appointmentId]
      );

      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async saveNotification(appointmentId, notificationUuid, reason) {
    try{
      const [result] = await this.pool.query(
        `
          INSERT INTO appointments_notifications (id, notification_uuid, reason)
          VALUES (?, ?, ?)
        `,
        [appointmentId, notificationUuid, reason]
      );
      return { success: true, data: { affectedRows: result.affectedRows > 0 } };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async getNotificationUuid(appointmentId) {
    try{
      const [rows] = await this.pool.query(
        `
          SELECT notification_uuid
          FROM appointments_notifications
          WHERE id = ? AND reason = 'createAppointment'
        `,
        [appointmentId]
      );
      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async getAppointmentNotificationsById(appointmentId) {
    try{
      const [rows] = await this.pool.query(
        `
          SELECT 
            notification_uuid,
            reason,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
          FROM appointments_notifications
          WHERE id = ?
          ORDER BY created_at DESC
        `,
        [appointmentId]
      );
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }
}

module.exports = { MySqlAppointmentsRepository };