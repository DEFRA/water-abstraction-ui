const routes = require('./routes');

const contactEntryPlugin = {
  register: (server) => {
    for (const eachRoute of Object.values(routes)) {
      server.route(eachRoute);
    }
  },

  pkg: {
    name: 'contactEntryPlugin',
    version: '1.0.0'
  }
};

module.exports = contactEntryPlugin;
