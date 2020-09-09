const { routes } = require('./routes');

const contactEntryPlugin = {
  register: (server) => {
    routes().map(eachRoute => server.route(eachRoute));
  },

  pkg: {
    name: 'contactEntryPlugin',
    version: '1.0.0'
  }
};

module.exports = contactEntryPlugin;
