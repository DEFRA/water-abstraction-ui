const factory = require('./units-factory');

const form = factory.create({
  labelText: 'Which units are you using?',
  isMeterUnits: true
});

module.exports = form;
