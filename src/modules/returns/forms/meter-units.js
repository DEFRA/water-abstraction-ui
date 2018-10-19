const factory = require('./units-factory');

const form = factory.create({
  labelText: 'What units does your meter use?',
  isMeterUnits: true
});

module.exports = form;
