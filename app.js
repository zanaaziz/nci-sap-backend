const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connection = require('./config/db');
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

// POST /login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.sendStatus(401);

        const user = results[0];
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
    connection.query('SELECT nodeId, language, translation FROM translations', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// POST /translations
app.post('/translations', authenticateJWT, (req, res) => {
    const translations = req.body;
    if (!Array.isArray(translations)) {
        return res.status(400).json({ error: 'Body must be an array' });
    }

    const values = translations.map(t => [t.nodeId, t.language, t.translation]);
    const query = `
        INSERT INTO translations (nodeId, language, translation)
        VALUES ?
        ON DUPLICATE KEY UPDATE translation = VALUES(translation)
    `;
    connection.query(query, [values], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Translations saved' });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});