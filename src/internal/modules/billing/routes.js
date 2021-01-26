const billRunRoutes = require('./routes/bill-run');
const twoPartTariff = require('./routes/two-part-tariff');
const createBillRun = require('./routes/create-bill-run');

module.exports = [
  ...Object.values(billRunRoutes),
  ...Object.values(twoPartTariff),
  ...Object.values(createBillRun)
];
