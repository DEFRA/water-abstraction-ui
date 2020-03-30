const billRunRoutes = require('./routes/bill-run');
const twoPartTariff = require('./routes/two-part-tariff');

module.exports = [
  ...Object.values(billRunRoutes),
  ...Object.values(twoPartTariff)
];
