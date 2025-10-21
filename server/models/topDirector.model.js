const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TopDirector = sequelize.define('TopDirector', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Nombre de la tabla de usuarios
        key: 'id',
      },
    },
    personId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'personId'],
      },
    ],
  });

  return TopDirector;
};