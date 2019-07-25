const { internalRoutingForm } = require('./internal-routing');
const { logReceiptForm, logReceiptSchema } = require('./log-receipt');
const { returnReceivedForm } = require('./return-received');

module.exports = {
  internalRoutingForm,
  logReceiptForm,
  logReceiptSchema,
  returnReceivedForm
};
