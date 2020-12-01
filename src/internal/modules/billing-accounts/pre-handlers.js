const Boom = require('@hapi/boom');
const { water } = require('../../lib/connectors/services');

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message);
  }
  throw err;
};

const loadBillingAccount = async request => {
  const { billingAccountId } = request.params;
  try {
    return water.invoiceAccounts.getInvoiceAccount(billingAccountId);
  } catch (err) {
    return errorHandler(err, `Cannot load billing account ${billingAccountId}`);
  }
};

exports.loadBillingAccount = loadBillingAccount;
