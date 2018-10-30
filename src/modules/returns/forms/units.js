const factory = require('./units-factory');

const form = factory.create({
  labelText: 'What is the unit of measurement?',
  isMeterUnits: false
});

module.exports = form;
