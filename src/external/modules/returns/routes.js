const viewRoutes = require('./routes/view');
const editRoutes = require('./routes/edit');
const uploadRoutes = require('./routes/upload');

module.exports = [
  ...Object.values(viewRoutes),
  ...Object.values(editRoutes),
  ...Object.values(uploadRoutes)
];
