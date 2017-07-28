const Hapi = require('hapi')
const server = new Hapi.Server()

server.connection({ port: 8000 })

const sessionPluginOptions = {
  cache: { segment: 'unique-cache-sement' },
  cookie: { isSecure: false },
  key: 'super-secret-cookie-encryption-key'
};

server.register(
  { register: require('hapi-server-session'), options: sessionPluginOptions },
  (err) => {
    if (err) {
      throw err;
    }
  }
);

server.register([require('inert'), require('vision')], (err) => {
  if (err) {
    throw err
  }
  // load views
  server.views(require('./views'))

  // load routes
  server.route(require('./src/routes/public'))
  server.route(require('./src/routes/default'))
})

// Start the server
server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
