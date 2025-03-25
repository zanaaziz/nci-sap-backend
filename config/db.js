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

function createTables() {
	const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255)
    )
  `;

	const createTranslationsTable = `
    CREATE TABLE IF NOT EXISTS translations (
      nodeId VARCHAR(50),
      language VARCHAR(10),
      translation TEXT,
      PRIMARY KEY (nodeId, language)
    )
  `;

	pool.query(createUsersTable, (err) => {
		if (err) {
			console.error('Error creating users table:', err);
			throw err;
		}
		console.log('Users table created or already exists');
	});

	pool.query(createTranslationsTable, (err) => {
		if (err) {
			console.error('Error creating translations table:', err);
			throw err;
		}
		console.log('Translations table created or already exists');
	});
}

// Function to seed database
const seed = require('../seed'); // Adjust the path if seed.js is in a different directory

function seedDatabase() {
	// Seed users
	seed.users.forEach((user) => {
		pool.query('INSERT INTO users (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [user.email, user.password], (err) => {
			if (err) console.error('Error seeding user:', err);
		});
	});

	// Seed translations
	if (seed.translations.length > 0) {
		const values = seed.translations.flatMap((t) => [t.nodeId, t.language, t.translation]);
		const placeholders = seed.translations.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
		const query = `
      INSERT INTO translations (nodeId, language, translation)
      VALUES ${placeholders}
      ON CONFLICT (nodeId, language) DO NOTHING
    `;
		pool.query(query, values, (err) => {
			if (err) console.error('Error seeding translations:', err);
		});
	}
}

// Ensure tables are created on startup
createTables();
seedDatabase();

module.exports = pool;
