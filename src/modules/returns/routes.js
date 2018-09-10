const viewRoutes = require('./routes/view');
const viewInternalRoutes = require('./routes/view-internal');
const editRoutes = require('./routes/edit');

module.exports = [
  ...Object.values(viewRoutes),
  ...Object.values(viewInternalRoutes),
  ...Object.values(editRoutes)
];
