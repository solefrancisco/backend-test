class MySqlMedicsRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findAllIds() {
        try {
            const [rows] = await this.pool.query(
                `
                    SELECT
                        core_user_id AS medic_id
                    FROM cached_medics
                    ORDER BY core_user_id ASC
                `
            );

            return { success: true, data: rows };
        } catch (error) {
            return { success: false, sqlState: error.sqlState, errorMessage: error.message };
        }
    }

    async findById(medicId) {
        try {
            const [rows] = await this.pool.query(
                `
                    SELECT
                        core_user_id AS medic_id
                    FROM cached_medics
                    WHERE core_user_id = ?
                    LIMIT 1
                `,
                [medicId]
            );

            return { success: true, data: rows[0] ?? null };
        } catch (error) {
            return { success: false, sqlState: error.sqlState, errorMessage: error.message };
        }
    }

    async saveId(medicId) {
        try {
            await this.pool.query(
                `
                    INSERT INTO cached_medics (core_user_id)
                    VALUES (?)
                `,
                [medicId]
            );

            return { success: true, data: { medic_id: medicId } };
        } catch (error) {
            return { success: false, sqlState: error.sqlState, errorMessage: error.message };
        }
    }
}

module.exports = { MySqlMedicsRepository };
