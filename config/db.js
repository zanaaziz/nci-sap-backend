const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        throw err;
    }
    console.log('Connected to MySQL');

    // Create users table if it doesn't exist
    connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            password VARCHAR(255)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
            throw err;
        }
        console.log('Users table created or already exists');
    });

    // Create translations table if it doesn't exist
    connection.query(`
        CREATE TABLE IF NOT EXISTS translations (
            nodeId VARCHAR(50),
            language VARCHAR(10),
            translation TEXT,
            PRIMARY KEY (nodeId, language)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating translations table:', err);
            throw err;
        }
        console.log('Translations table created or already exists');
    });
});

module.exports = connection;