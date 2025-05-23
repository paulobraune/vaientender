const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { initI18n, i18nextMiddleware } = require('./config/i18n');
const { initSession } = require('./config/session');
const { initDatabase } = require('./config/database-config');

const { syncLanguage } = require('./middleware/i18n');
const { getActiveBusiness } = require('./middleware/business');
const { notFound, errorHandler } = require('./middleware/error');
const { checkInviteCode } = require('./middleware/auth');

const routes = require('./routes');
const productVideoRoutes = require('./routes/productVideoRoutes');

const app = express();

// Initialize database connection
initDatabase().catch(err => {
  console.error('Database initialization error:', err);
});

const i18next = initI18n();

app.use(i18nextMiddleware.handle(i18next));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/locales', express.static(path.join(__dirname, '../locales')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// ESSENCIAL PARA PRODUÇÃO ATRÁS DE PROXY (Render, Heroku, etc)
app.set('trust proxy', 1);

// Inicialização da sessão após trust proxy
app.use(initSession());

app.use(syncLanguage);

app.use(getActiveBusiness);

// Apply invite code middleware for the entire app
app.use(checkInviteCode);

// Log information about the application environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Starting server in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
if (isProduction) {
  console.log('Using Redis for session management');
  console.log('Using MongoDB for database storage');
} else {
  console.log('Using file-based session storage');
  console.log('Using file-based database storage');
}

// Mount product video routes under /api
app.use('/api', productVideoRoutes);

// Mount other routes
app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
