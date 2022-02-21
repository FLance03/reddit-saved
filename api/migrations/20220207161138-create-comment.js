'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.createTable('comments', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      save_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT('medium'),
        defaultValue: '',
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
    await queryInterface.dropTable('comments');
  }
};