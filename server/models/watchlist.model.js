const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Watchlist = sequelize.define('Watchlist', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // This is the table name
        key: 'id',
      },
    },
    movieId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: true,
    indexes: [
      { unique: true, fields: ['userId', 'movieId'] },
    ],
  });

  return Watchlist;
};