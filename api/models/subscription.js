'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Account, {
        foreignKey: {
          name: 'account_id',
          allowNull: false,
        }
      });
      
      this.belongsTo(models.Subreddit, {
        foreignKey: {
          name: 'subreddit_id',
          allowNull: false,
        }
      });
    }
  }
  Subscription.init({
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    subreddit_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    account_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
    },
    deleted_at: {
      type: Sequelize.DATE,
    },
  }, {
    sequelize,
    modelName: 'Subscription',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });
  return Subscription;
};