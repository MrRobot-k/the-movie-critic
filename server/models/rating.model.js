const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rating = sequelize.define('Rating', {
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
    movieId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // No hay clave foránea directa a un modelo Movie ya que las películas vienen de TMDb
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.5,
        max: 5,
      },
    },
  });

  return Rating;
};
