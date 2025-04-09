const express = require('express');
const { pool } = require('../config/db');
const { authenticateJWT } = require('./auth');

const router = express.Router();

// Helper functions to transform data between database and frontend formats

// Transform database rows to frontend format
// Converts rows like [{node_id: 'n1', language: 'en', translation: 'Hello'}, ...]
// to [{node_id: 'n1', en: 'Hello', es: 'Hola'}, ...]
function transformToFrontendFormat(dbRows) {
	const grouped = dbRows.reduce((acc, row) => {
		const { node_id, language, translation } = row;
		if (!acc[node_id]) {
			acc[node_id] = { node_id };
		}
		acc[node_id][language] = translation;
		return acc;
	}, {});
	return Object.values(grouped);
}

// Transform frontend data to database format
// Converts [{node_id: 'n1', en: 'Hello', es: 'Hola'}, ...]
// to [{node_id: 'n1', language: 'en', translation: 'Hello'}, ...]
function transformToDatabaseFormat(frontendData) {
	const dbRows = [];
	frontendData.forEach((item) => {
		const { node_id, ...languages } = item;
		for (const [language, translation] of Object.entries(languages)) {
			if (translation !== undefined) {
				dbRows.push({ node_id, language, translation });
			}
		}
	});
	return dbRows;
}

// GET /translations
// Retrieve all translations in frontend format, requires authentication
router.get('/', authenticateJWT, (req, res) => {
	pool.query('SELECT node_id, language, translation FROM translations', (err, results) => {
		if (err) return res.status(500).json({ error: 'Database error' });
		const frontendData = transformToFrontendFormat(results.rows);
		res.json(frontendData);
	});
});

// POST /translations
// Save translations sent from the frontend, requires authentication
// Expects an array of objects with node_id and language-translation pairs
router.post('/', authenticateJWT, (req, res) => {
	let translations = req.body;

	if (!Array.isArray(translations)) {
		return res.status(400).json({ error: 'Body must be an array' });
	}

	translations = transformToDatabaseFormat(translations);

	if (translations.length === 0) {
		return res.json({ message: 'No translations to save' });
	}

	// Prepare values for the SQL query
	const values = translations.flatMap((t) => [t.node_id, t.language, t.translation]);
	// Generate placeholders for the VALUES clause
	const placeholders = translations.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
	// SQL query to insert or update translations
	const query = `
        INSERT INTO translations (node_id, language, translation)
        VALUES ${placeholders}
        ON CONFLICT (node_id, language) DO UPDATE SET translation = EXCLUDED.translation
    `;

	pool.query(query, values, (err) => {
		if (err) {
			console.error('Error saving translations:', err);
			return res.status(500).json({ error: 'Database error' });
		}
		res.json({ message: 'Translations saved' });
	});
});

// INSECURE: Vulnerable to SQL injection
router.get('/search', (req, res) => {
	const searchTerm = req.query.term; // User input from query parameter
	// Directly concatenate user input into SQL query
	pool.query(`SELECT * FROM translations WHERE translation LIKE '%${searchTerm}%'`, (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message }); // Exposes error details
		}

		if (results.rows.length === 0) {
			// Vulnerable to Reflected XSS
			res.json({ message: `No results found for ${searchTerm}` });
		} else {
			res.json(results.rows);
		}

		res.json(results.rows);
	});
});

module.exports = router;
