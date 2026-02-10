// models/index.js
const sequelize = require('../config/database'); // import configured Sequelize

// Import model definitions
const ExpenseModel = require('./Expense');
const CategoryModel = require('./Category');
const UserModel = require('./User');

// Initialize models
const Expense = ExpenseModel(sequelize);
const Category = CategoryModel(sequelize);
const User = UserModel(sequelize);

// Setup associations
Expense.belongsTo(Category, { foreignKey: 'CategoryId' });
Expense.belongsTo(User, { foreignKey: 'UserId' });

Category.hasMany(Expense, { foreignKey: 'CategoryId' });
User.hasMany(Expense, { foreignKey: 'UserId' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  Expense,
  Category,
  User
};
