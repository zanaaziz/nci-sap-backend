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
		{ nodeId: 'n1', language: 'en', translation: 'Hello' },
		{ nodeId: 'n1', language: 'es', translation: 'Hola' },
		{ nodeId: 'n2', language: 'en', translation: 'Good morning' },
		{ nodeId: 'n2', language: 'es', translation: 'Buenos días' },
	],
};
