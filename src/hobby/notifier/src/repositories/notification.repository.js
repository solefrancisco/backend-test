class MySqlNotificationRepository {
  constructor(pool) {
    this.pool = pool;
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
      return {
        success: false,
        sqlState: error.sqlState,
        errorMessage: error.message,
      };
    }
  }
}

module.exports = { MySqlNotificationRepository };