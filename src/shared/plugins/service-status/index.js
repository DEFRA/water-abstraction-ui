const routes = require('./routes');

const plugin = {
  name: 'service-status',
  register: async server => routes.forEach(route => server.route(route))
};

module.exports = plugin;
