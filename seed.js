const bcrypt = require('bcrypt');
const connection = require('./config/db');

const users = [
    { email: 'user1@example.com', password: 'password1' },
    { email: 'user2@example.com', password: 'password2' }
];

users.forEach(user => {
    bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) throw err;
        connection.query('INSERT INTO users (email, password) VALUES (?, ?)', [user.email, hash], (err) => {
            if (err) throw err;
            console.log(`Inserted ${user.email}`);
        });
    });
});