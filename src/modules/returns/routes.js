const viewRoutes = require('./routes/view');
const editRoutes = require('./routes/edit');

module.exports = [
  ...Object.values(viewRoutes),
  ...Object.values(editRoutes)
];
