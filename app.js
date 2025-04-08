const express = require('express');
const app = express();

const { initializeDatabase } = require('./config/db');
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());
let port = process.env.PORT || 3000;

// Mount auth routes
const authRouter = require('./routes/auth').router;
app.use('/auth', authRouter);

// Mount translations routes
const translationsRouter = require('./routes/translations');
app.use('/translations', translationsRouter);

// Root route
app.get('/', (req, res) => {
	res.send('NCI SAP Backend');
});

async function startApp() {
	try {
		await initializeDatabase();
		app.listen(port, () => {
			console.log(`Server running on port ${port}`);
		});
	} catch (err) {
		console.error('Failed to initialize database:', err);
		process.exit(1);
	}
}

startApp();
