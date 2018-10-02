const factory = require('./units-factory');

const form = factory.create({
  labelText: 'What units does your meter use?',
  actionUrl: '/return/meter/units'
});

module.exports = form;
