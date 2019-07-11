const viewRoutes = require('./routes/view');
const uploadRoutes = require('./routes/upload');

module.exports = [
  ...Object.values(viewRoutes),
  ...require('./routes/edit'),
  ...Object.values(uploadRoutes)
];
