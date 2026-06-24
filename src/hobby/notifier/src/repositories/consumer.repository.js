class MySqlNotificationConsumerRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async updateRetryCount(uuid, retryCount) {
    try {
      const [rows] = await this.pool.query(
        `
            UPDATE sent
            SET 
                retries = ?,
                status = 'retrying'
            WHERE uuid = ?
        `,
        [retryCount, uuid]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async updateStatus(uuid, status) {
    try {
      const [rows] = await this.pool.query(
        `
            UPDATE sent
            SET status = ?
            WHERE uuid = ?
        `,
        [status, uuid]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }
}

module.exports = { MySqlNotificationConsumerRepository };