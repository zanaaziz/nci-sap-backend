const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool, initializeDatabase } = require('./config/db');
require('dotenv').config();

const app = express();
app.use(express.json());

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.sendStatus(401);

	const token = authHeader.split(' ')[1];
	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) return res.sendStatus(403);
		req.user = user;
		next();
	});
};

// Transform database rows to frontend format
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

// POST /login
app.post('/login', (req, res) => {
	const { email, password } = req.body;
	pool.query('SELECT * FROM users WHERE email = $1', [email], (err, results) => {
		if (err) return res.status(500).json({ error: 'Database error' });
		if (results.rows.length === 0) return res.sendStatus(401);

		const user = results.rows[0];
		bcrypt.compare(password, user.password, (err, match) => {
			if (err) return res.status(500).json({ error: 'Error comparing passwords' });
			if (!match) return res.sendStatus(401);

			const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
			res.json({ token });
		});
	});
});

// GET /translations
app.get('/translations', authenticateJWT, (req, res) => {
	pool.query('SELECT node_id, language, translation FROM translations', (err, results) => {
		if (err) return res.status(500).json({ error: 'Database error' });
		const frontendData = transformToFrontendFormat(results.rows);
		res.json(frontendData);
	});
});

// POST /translations
app.post('/translations', authenticateJWT, (req, res) => {
	let translations = req.body;

	if (!Array.isArray(translations)) {
		return res.status(400).json({ error: 'Body must be an array' });
	}

	translations = transformToDatabaseFormat(translations);

	if (translations.length === 0) {
		return res.json({ message: 'No translations to save' });
	}

	const values = translations.flatMap((t) => [t.node_id, t.language, t.translation]);
	const placeholders = translations.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
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

async function startApp() {
	try {
		await initializeDatabase();
		app.listen(3000, () => {
			console.log('Server running on port 3000');
		});
	} catch (err) {
		console.error('Failed to initialize database:', err);
		process.exit(1);
	}
}

startApp();
