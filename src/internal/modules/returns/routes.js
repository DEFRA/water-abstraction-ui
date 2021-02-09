const viewInternalRoutes = require('./routes/view-internal');
const editInternalRoutes = require('./routes/edit-internal');
const internalRoutes = require('./routes/internal');
const deleteRoutes = require('./routes/delete');

module.exports = [
  ...Object.values(viewInternalRoutes),
  ...editInternalRoutes,
  ...Object.values(internalRoutes),
  ...Object.values(deleteRoutes)
];
