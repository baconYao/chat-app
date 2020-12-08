'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { User, Message } = models;
      // 預設會根據 reactions 表內的 MessageId 欄位去 messages 表找對應的訊息
      // 但我們在 reactions 表內沒有 MessageId，而是 messageId。user 同理。
      this.belongsTo(Message, {foreignKey: 'messageId'});
      this.belongsTo(User, {foreignKey: 'userId'});
    }
  };
  Reaction.init({
    // content: DataTypes.STRING,
    // uuid: DataTypes.UUID,
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Reaction',
    tableName: 'reactions'
  });
  return Reaction;
};