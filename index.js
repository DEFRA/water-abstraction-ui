require('dotenv').config()

const Hapi = require('hapi')
const serverOptions={connections:{router:{stripTrailingSlash:true}}}
const server = new Hapi.Server(serverOptions)

server.connection({ port: process.env.PORT || 8000 })

const cacheKey=process.env.cacheKey||'super-secret-cookie-encryption-key'
console.log('Cache key'+cacheKey)
const sessionPluginOptions = {
  cache: { segment: 'unique-cache-sement' },
  cookie: { isSecure: true },
  key: cacheKey
}

server.register(
  { register: require('hapi-server-session'), options: sessionPluginOptions },
  (err) => {
    if (err) {
      throw err
    }
  }
)

server.register([require('inert'), require('vision')], (err) => {
  if (err) {
    throw err
  }
  // load views
  server.views(require('./src/views'))

  // load routes
  server.route(require('./src/routes/public'))
  server.route(require('./src/routes/default'))
  server.route(require('./src/routes/API'))
})



// Start the server
server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
module.exports = server
