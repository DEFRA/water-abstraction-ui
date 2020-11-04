const invoiceAccountRoutes = require('./routes/invoice-accounts');
const contactRoutes = require('./routes/contacts');

const config = require('../../config');

if (config.featureToggles.manageInvoiceAccounts) {
  module.exports = [
    ...Object.values(invoiceAccountRoutes),
    ...Object.values(contactRoutes)
  ];
};
