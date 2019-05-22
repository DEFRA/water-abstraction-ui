const viewInternalRoutes = require('./routes/view-internal');
const editInternalRoutes = require('./routes/edit-internal');
const internalRoutes = require('./routes/internal');

module.exports = [
  ...Object.values(viewInternalRoutes),
  ...Object.values(editInternalRoutes),
  ...Object.values(internalRoutes)
];
