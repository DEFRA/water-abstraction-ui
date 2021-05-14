const billsTab = require('./routes/bills-tab');
const licenceSummary = require('./routes/licence-summary');

module.exports = [
  ...Object.values(billsTab),
  ...Object.values(licenceSummary)
];
