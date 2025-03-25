// seed.js
const bcrypt = require('bcrypt');

// Hash passwords for security
const hashedPassword1 = bcrypt.hashSync('password1', 10);
const hashedPassword2 = bcrypt.hashSync('password2', 10);

module.exports = {
	users: [
		{ email: 'user1@example.com', password: hashedPassword1 },
		{ email: 'user2@example.com', password: hashedPassword2 },
	],
	translations: [
		{ node_id: 'n1', language: 'en', translation: 'Hello' },
		{ node_id: 'n1', language: 'es', translation: 'Hola' },
		{ node_id: 'n2', language: 'en', translation: 'Good morning' },
		{ node_id: 'n2', language: 'es', translation: 'Buenos días' },
	],
};
