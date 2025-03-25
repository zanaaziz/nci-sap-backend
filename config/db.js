const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
	console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});

async function createTables() {
	const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            password VARCHAR(255)
        )
    `;

	const createTranslationsTable = `
        CREATE TABLE IF NOT EXISTS translations (
            node_id VARCHAR(50),
            language VARCHAR(10),
            translation TEXT,
            PRIMARY KEY (node_id, language)
        )
    `;

	try {
		await pool.query(createUsersTable);
		await pool.query(createTranslationsTable);

		console.log('Tables created');
	} catch (err) {
		console.error('Error creating tables:', err);
		throw err;
	}
}

const seed = require('../seed');

async function seedDatabase() {
	try {
		for (const user of seed.users) {
			await pool.query('INSERT INTO users (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [user.email, user.password]);
		}
		if (seed.translations.length > 0) {
			const values = seed.translations.flatMap((t) => [t.node_id, t.language, t.translation]);
			const placeholders = seed.translations.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
			const query = `
                INSERT INTO translations (node_id, language, translation)
                VALUES ${placeholders}
                ON CONFLICT (node_id, language) DO NOTHING
            `;
			await pool.query(query, values);
		}
		console.log('Database seeded');
	} catch (err) {
		console.error('Error seeding database:', err);
		throw err;
	}
}

async function initializeDatabase() {
	await createTables();
	await seedDatabase();
}

module.exports = {
	pool,
	initializeDatabase,
};
