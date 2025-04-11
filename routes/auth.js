const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
require('dotenv').config();

const router = express.Router();

// JWT Authentication Middleware
// This middleware checks for a valid JWT token in the Authorization header
const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.sendStatus(401); // No token provided

	const token = authHeader.split(' ')[1];
	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) return res.sendStatus(403); // Invalid token
		req.user = user;
		next();
	});
};

// POST /login
// Handle user login and issue JWT token upon successful authentication
router.post('/login', (req, res) => {
	const { email, password } = req.body;
	pool.query('SELECT * FROM users WHERE email = $1', [email], (err, results) => {
		if (err) return res.status(500).json({ error: 'Database error' });
		if (results.rows.length === 0) return res.sendStatus(401); // User not found

		const user = results.rows[0];
		bcrypt.compare(password, user.password, (err, match) => {
			if (err) return res.status(500).json({ error: 'Error comparing passwords' });
			if (!match) return res.sendStatus(401); // Password mismatch

			const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '300d' });
			res.json({ token, role: user.role });
		});
	});
});

module.exports = { router, authenticateJWT };
