const plugin = {
  name: 'no-robots',
  register: async function (server) {
    server.route({
      method: 'GET',
      path: '/robots.txt',
      handler: () => 'User-agent: * Disallow: /',
      config: {
        auth: false
      }
    });
  }
};

module.exports = plugin;
