const routes = require('./routes');

const plugin = {
  name: 'static-assets',
  register: async function (server) {
    Object.values(routes).forEach(route => server.route(route));
  }
};

module.exports = plugin;
