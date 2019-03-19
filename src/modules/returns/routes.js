const viewRoutes = require('./routes/view');
const viewInternalRoutes = require('./routes/view-internal');
const editRoutes = require('./routes/edit');
const editInternalRoutes = require('./routes/edit-internal');
const internalRoutes = require('./routes/internal');
const uploadRoutes = require('./routes/upload');

module.exports = [
  ...Object.values(viewRoutes),
  ...Object.values(viewInternalRoutes),
  ...Object.values(editRoutes),
  ...Object.values(editInternalRoutes),
  ...Object.values(internalRoutes),
  ...Object.values(uploadRoutes)
];
