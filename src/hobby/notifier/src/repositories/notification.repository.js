class MySqlNotificationRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async filter(queryFilters, query) {
    let conditions = [];
    let values = [queryFilters.since, queryFilters.until];
    let page = 1;

    if (queryFilters.sent_by) {
      conditions.push(`sent_by = ?`);
      values.push(queryFilters.sent_by);
    }

    if (queryFilters.notified_by) {
      conditions.push(`notified_by = ?`);
      values.push(queryFilters.notified_by);
    }
    
    query += " WHERE created_at between ? AND ?";

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    if (queryFilters.page) {
      page = Number(queryFilters.page);
    }

    return { query, conditions, values, page };
  }

  async validateApiKey(apiKey) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT owner
          FROM api_keys
          WHERE api_key_hash = ?
            AND is_active = 1
          LIMIT 1
        `,
        [apiKey]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async saveNotification(data) {
    try {
      const [result] = await this.pool.query(
        `
          INSERT INTO sent (sent_by, uuid, notified_by, data)
          VALUES(?, ?, ?, ?)
        `,
        [ data.apiKeyOwner,  data.uuid, data.notified_by, data.data ]
      );
      return { success: true };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  } 

  async getNotifications(limit, queryFilters) {
    try {
      const baseQuery = `
        SELECT 
          id,
          uuid,
          sent_by,
          notified_by,
          status,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
        FROM sent
      `;

      let { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const offset = (page - 1) * limit;
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.pool.execute(
        query, 
        values
      );

      return {
        success: true,
        data: rows
      };

    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async count(queryFilters) {
    try {
      const baseQuery = `
        SELECT COUNT(1) AS count
        FROM sent
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
  
  async findByUuid(uuid) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT
            sent_by,
            notified_by,
            status,
            data,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
          FROM sent
          WHERE uuid = ?
          LIMIT 1
        `,
        [uuid]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }
}

module.exports = { MySqlNotificationRepository };