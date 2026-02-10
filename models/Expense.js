const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Expense', {
    title: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false }
  });
};
