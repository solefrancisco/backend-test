class MySqlNotificationRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(data) {
    try {
      const [result] = await this.pool.query(
        `
          INSERT INTO notifications (
            notify_by,
            notification_type,
            status,
            recipient,
            subject,
            payload,
            api_key_id,
            retries,
            created_at,
            updated_at
          )
          VALUES (?, ?, 'PENDING', ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [
          data.notifyBy,
          data.notificationType,
          data.recipient ?? null,
          data.subject ?? null,
          JSON.stringify(data.payload ?? data),
          data.apiKeyId ?? null,
        ]
      );

      return { success: true, data: result.insertId };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }

  async findById(notificationId) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT
            id,
            notify_by,
            notification_type,
            status,
            recipient,
            subject,
            payload,
            api_key_id,
            retries,
            DATE_FORMAT(sent_at, '%Y-%m-%d %H:%i:%s') AS sent_at,
            DATE_FORMAT(failed_at, '%Y-%m-%d %H:%i:%s') AS failed_at,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
          FROM notifications
          WHERE id = ?
          LIMIT 1
        `,
        [notificationId]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }

  async findAll(limit, queryFilters) {
    try {
      let query = `
        SELECT
          id,
          notify_by,
          notification_type,
          status,
          recipient,
          subject,
          payload,
          api_key_id,
          retries,
          DATE_FORMAT(sent_at, '%Y-%m-%d %H:%i:%s') AS sent_at,
          DATE_FORMAT(failed_at, '%Y-%m-%d %H:%i:%s') AS failed_at,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
        FROM notifications
      `;

      const conditions = [];
      const values = [];
      let page = 1;

      if (queryFilters.notify_by) {
        conditions.push('notify_by = ?');
        values.push(queryFilters.notify_by);
      }

      if (queryFilters.notification_type) {
        conditions.push('notification_type = ?');
        values.push(queryFilters.notification_type);
      }

      if (queryFilters.status) {
        conditions.push('status = ?');
        values.push(queryFilters.status);
      }

      if (queryFilters.recipient) {
        conditions.push('recipient = ?');
        values.push(queryFilters.recipient);
      }

      if (queryFilters.created_since) {
        conditions.push('created_at >= ?');
        values.push(queryFilters.created_since);
      }

      if (queryFilters.created_until) {
        conditions.push('created_at <= ?');
        values.push(queryFilters.created_until);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (queryFilters.page) {
        page = Number(queryFilters.page);
      }

      const offset = (page - 1) * limit;
      query += ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.pool.query(query, values);

      return { success: true, data: rows };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }

  async count(queryFilters) {
    try {
      let query = `
        SELECT COUNT(1) AS count
        FROM notifications
      `;

      const conditions = [];
      const values = [];

      if (queryFilters.notify_by) {
        conditions.push('notify_by = ?');
        values.push(queryFilters.notify_by);
      }

      if (queryFilters.notification_type) {
        conditions.push('notification_type = ?');
        values.push(queryFilters.notification_type);
      }

      if (queryFilters.status) {
        conditions.push('status = ?');
        values.push(queryFilters.status);
      }

      if (queryFilters.recipient) {
        conditions.push('recipient = ?');
        values.push(queryFilters.recipient);
      }

      if (queryFilters.created_since) {
        conditions.push('created_at >= ?');
        values.push(queryFilters.created_since);
      }

      if (queryFilters.created_until) {
        conditions.push('created_at <= ?');
        values.push(queryFilters.created_until);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const [rows] = await this.pool.query(query, values);

      return { success: true, data: rows[0].count };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }

  async markAsProcessing(notificationId) {
    try {
      const [result] = await this.pool.query(
        `
          UPDATE notifications
          SET
            status = 'PROCESSING',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND status = 'PENDING'
        `,
        [notificationId]
      );

      return {
        success: true,
        data: { affectedRows: result.affectedRows > 0 },
      };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }

  async markAsSent(notificationId) {
    try {
      const [result] = await this.pool.query(
        `
          UPDATE notifications
          SET
            status = 'SENT',
            sent_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND status IN ('PENDING', 'PROCESSING')
        `,
        [notificationId]
      );

      return {
        success: true,
        data: { affectedRows: result.affectedRows > 0 },
      };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }

  async validateApiKey(apiKey) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT id
          FROM api_keys
          WHERE api_key = ?
            AND is_active = 1
          LIMIT 1
        `,
        [apiKey]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }
}

module.exports = { MySqlNotificationRepository };