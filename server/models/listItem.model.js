const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ListItem = sequelize.define('ListItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    listId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Lists',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    mediaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['listId', 'mediaId', 'mediaType']
      }
    ]
  });

  return ListItem;
};
