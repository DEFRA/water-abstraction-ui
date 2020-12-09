const routes = require('./routes');

const accountEntryPlugin = {
  register: (server) => {
    for (const eachRoute of Object.values(routes)) {
      server.route(eachRoute);
    }
  },

  pkg: {
    name: 'accountEntryPlugin',
    version: '1.0.0'
  }
};

module.exports = accountEntryPlugin;
