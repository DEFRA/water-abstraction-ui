const factory = require('./units-factory');

const form = factory.create({
  labelText: 'What is the unit of measurement?',
  actionUrl: '/return/units'
});

module.exports = form;
