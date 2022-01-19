const { get } = require('lodash');
const Boom = require('@hapi/boom');

/**
 * Redirects the user to the billing account
 * @param  {Object} billingAccount
 * @param  {Object} view  - view data
 * @param  {Object} h     - HAPI response toolkit
 * @return {Object}       - HAPI HTTP redirect response
 */
const redirectToBillingAccount = (billingAccount, view, h) => {
  const billingAccountId = get(view, 'billingAccount.invoiceAccountId');
  if (billingAccountId) {
    return h.redirect(`/billing-accounts/${billingAccountId}`);
  } else {
    throw Boom.notFound('Billing account not found');
  }
};

module.exports = {
  redirectToBillingAccount
};
