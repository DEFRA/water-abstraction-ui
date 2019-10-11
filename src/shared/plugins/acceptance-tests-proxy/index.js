const routes = require('./routes');

const plugin = {
  name: 'acceptance-tests-proxy',
  register: async server => routes.forEach(route => server.route(route))
};

module.exports = plugin;
