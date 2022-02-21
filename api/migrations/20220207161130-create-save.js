'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.createTable('saves', {
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('saves');
  }
};