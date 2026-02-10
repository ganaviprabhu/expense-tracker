const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'expense_tracker',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',   // ✅ THIS IS THE FIX
    logging: false
  }
);

module.exports = sequelize;
