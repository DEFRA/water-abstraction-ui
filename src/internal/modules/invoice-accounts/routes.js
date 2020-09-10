const invoiceAccountRoutes = require('./routes/invoice-accounts');
const contactRoutes = require('./routes/contacts');

module.exports = [
  ...Object.values(invoiceAccountRoutes),
  ...Object.values(contactRoutes)
];
