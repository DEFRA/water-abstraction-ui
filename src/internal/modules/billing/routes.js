const billRunRoutes = require('./routes/bill-run');
const twoPartTariff = require('./routes/two-part-tariff');
const createBillRun = require('./routes/create-bill-run');
const view = require('./routes/view');

module.exports = [
  ...Object.values(billRunRoutes),
  ...Object.values(twoPartTariff),
  ...Object.values(createBillRun),
  ...Object.values(view)
];
