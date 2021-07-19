const { internalRoutingForm, internalRoutingFormSchema } = require('./internal-routing');
const { logReceiptForm, logReceiptSchema } = require('./log-receipt');
const { returnReceivedForm } = require('./return-received');

module.exports = {
  internalRoutingFormSchema,
  internalRoutingForm,
  logReceiptForm,
  logReceiptSchema,
  returnReceivedForm
};
