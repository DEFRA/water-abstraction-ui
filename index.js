require('dotenv').config()

const Hapi = require('hapi')
const serverOptions = {connections: {router: {stripTrailingSlash: true}}}
const server = new Hapi.Server(serverOptions)

server.connection({ port: process.env.PORT})

server.state('sessionCookie', {
    ttl: 24 * 60 * 60 * 1000,     // One day
    isSecure: false, isHttpOnly: false, isSameSite: 'Lax',
    encoding: 'base64json'
});


server.register({
  register: require('hapi-server-session'),
  options: {
    cookie: {
      isSecure: false, isSameSite: false
    }
  }
}, function (err) { if (err) { throw err } })

server.register([{
            register: require('hapi-auth-cookie')
        },require('inert'), require('vision')], (err) => {



          server.auth.strategy('standard', 'cookie', {
                      password: 'somecrazycookiesecretthatcantbeguesseswouldgohere', // cookie secret
                      isSecure: false, // required for non-https applications
                      isSameSite: 'Lax',
                      ttl: 24 * 60 * 60 * 1000, // Set session to 1 day,
                      redirectTo: '/signin',
                      isHttpOnly:false
                  });

                  server.auth.default({
                      strategy: 'standard',mode:'try'
                  });

  // load views
  server.views(require('./src/views'))
  // load routes
  server.route(require('./src/routes/public'))
  server.route(require('./src/routes/VmL'))


})

server.errorHandler = function (error) {
  throw error
}


server.ext({
    type: 'onPreHandler',
    method: function (request, reply) {
      //console.log(request.url.href+' requested')

        return reply.continue();
    }
});


// Start the server
server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
module.exports = server
