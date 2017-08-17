require('dotenv').config()

const Hapi = require('hapi')
const serverOptions={connections:{router:{stripTrailingSlash:true}}}
const server = new Hapi.Server(serverOptions)

server.connection({ port: process.env.PORT})

const sessionPluginOptions = {
  cache: { segment: 'unique-cache-sement' },
  cookie: { isSecure: false },
  key: 'bla-bla-bla'
}


//isSecure = true for live...
var yar_options = {
    storeBlank: false,
    cookieOptions: {
        password: process.env.cacheKey,
        isSecure: false
    }
};

server.register({
    register: require('yar'),
    options: yar_options
}, function (err) { });

server.register([require('inert'), require('vision')], (err) => {

  // load views
  server.views(require('./src/views'))
  // load routes
  server.route(require('./src/routes/public'))
  server.route(require('./src/routes/VmL'))

})

server.errorHandler=function(error){
  throw error
}

// Start the server
server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
module.exports = server
