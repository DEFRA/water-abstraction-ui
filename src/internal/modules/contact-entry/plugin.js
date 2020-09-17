const routes = require('./routes');

const contactEntryPlugin = {
  register: (server) => {
    for (const [key, eachRoute] of Object.entries(routes)) {
      server.route(eachRoute);
    }
  },

  pkg: {
    name: 'contactEntryPlugin',
    version: '1.0.0'
  }
};

module.exports = contactEntryPlugin;
