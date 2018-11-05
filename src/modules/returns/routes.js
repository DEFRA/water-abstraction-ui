const viewRoutes = require('./routes/view');
const viewInternalRoutes = require('./routes/view-internal');
const editRoutes = require('./routes/edit');
const editInternalRoutes = require('./routes/edit-internal');
const logReceiptRoutes = require('./routes/log-receipt');

module.exports = [
  ...Object.values(viewRoutes),
  ...Object.values(viewInternalRoutes),
  ...Object.values(editRoutes),
  ...Object.values(editInternalRoutes),
  ...Object.values(logReceiptRoutes)
];
