const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserTopActors = sequelize.define('UserTopActors', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    actorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profile_path: {
      type: DataTypes.STRING
    },
    character: {
      type: DataTypes.STRING
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  return UserTopActors;
};