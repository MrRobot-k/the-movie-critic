const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Like = sequelize.define('Like', {
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
      // No direct foreign key to a Movie model as movies are from TMDb
    },
  }, {
    indexes: [ // Ensure a user can only like a movie once
      {
        unique: true,
        fields: ['userId', 'movieId']
      }
    ]
  });

  return Like;
};
