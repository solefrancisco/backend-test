class MySqlSpecialitiesRepository {
  constructor(pool) {
    this.pool = pool;
  }
  async filter(queryFilters, query) {
    let conditions = [];
    let values = [];
    let page = 1;
    
    if (queryFilters.is_high_complexity) {
      conditions.push('is_high_complexity = ?');
      values.push(queryFilters.is_high_complexity);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (queryFilters.page) {
      page = Number(queryFilters.page);
    }
  
    return { query, conditions, values, page };
  }


  async findById(specialityId) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT
            id,
            name,
            is_high_complexity,
            type
          FROM specialities
          WHERE id = ?
          LIMIT 1
        `,
        [specialityId]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findByName(name) {
    try {
      const [rows] = await this.pool.query(
        `
          SELECT
            id,
            name,
            is_high_complexity,
            type
          FROM specialities
          WHERE LOWER(name) = LOWER(?)
          LIMIT 1
        `,
        [name]
      );

      return { success: true, data: rows[0] ?? null };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async create(data) {
    try {
      const [result] = await this.pool.query(
        `
          INSERT INTO specialities (
            name,
            is_high_complexity,
            type
          )
          VALUES (?, ?, ?)
        `,
        [
          data.name,
          data.is_high_complexity,
          data.type
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async findAll(limit, queryFilters) {
    try{
      const baseQuery = `
          SELECT
            id,
            name,
            is_high_complexity,
            type
          FROM specialities
        `;

      const { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const offset = (page - 1) * limit;
      const finalQuery = query + ' ORDER BY name ASC, id ASC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await this.pool.query(finalQuery, values);

      return { success: true, data: rows };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }

  async count(queryFilters) {
    try{
      const baseQuery = `
          SELECT COUNT(1) AS count 
          FROM specialities
        `;

      const { query, conditions, values, page } = await this.filter(queryFilters, baseQuery);
      const [rows] = await this.pool.query(query, values);
      return { success: true, data: rows[0].count };
    } catch (error) {
      return { success: false, sqlState: error.sqlState, errorMessage: error.message };
    }
  }
}

module.exports = { MySqlSpecialitiesRepository };
