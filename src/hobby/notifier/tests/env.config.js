process.env.PORT = process.env.PORT ?? '3000';

// DATABASE
process.env.DB_ENABLED = process.env.DB_ENABLED ?? 'true';
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '3306';
process.env.DB_USER = process.env.DB_USER ?? 'test';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'test';
process.env.DB_NAME = process.env.DB_NAME ?? 'test_db';
process.env.DB_CONNECTION_LIMIT = process.env.DB_CONNECTION_LIMIT ?? '10';
process.env.DB_QUEUE_LIMIT = process.env.DB_QUEUE_LIMIT ?? '0';
process.env.DB_WAIT_FOR_CONNECTIONS = process.env.DB_WAIT_FOR_CONNECTIONS ?? 'true';

// PAGINATION
process.env.PAGINATION_DEFAULT_PAGE_SIZE = process.env.PAGINATION_DEFAULT_PAGE_SIZE ?? '10';

// MODULES
process.env.APPOINTMENTS_ENABLED = process.env.APPOINTMENTS_ENABLED ?? 'true';