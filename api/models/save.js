'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Save extends Model {
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
      this.hasOne(models.Post, {
        foreignKey: {
          name: 'save_id',
          allowNull: false,
        },
      });
      this.hasOne(models.Comment, {
        foreignKey: {
          name: 'save_id',
          allowNull: false,
        },
      });
    }
  }
  Save.init({
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
    saves_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    author: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    date_posted: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    link: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    upvotes: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    downvotes: {
      type: Sequelize.INTEGER,
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
    modelName: 'Save',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });
  return Save;
};