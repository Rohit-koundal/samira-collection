const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');

dotenv.config();

async function startServer() {
  await connectDB();

  const PORT = process.env.SERVER_PORT || process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`));
}

startServer();

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error.message);
});
