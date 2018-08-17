const external = require('./external-routes');
const admin = require('./admin-routes');

module.exports = [
  ...Object.values(external),
  ...Object.values(admin)
];
