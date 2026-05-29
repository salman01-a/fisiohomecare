require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { initializeFirebase } = require('./config/firebase');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync models (development only — use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }

    // Initialize Firebase (optional)
    initializeFirebase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 FisioHomecare API running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API base URL: http://localhost:${PORT}/v1`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();
