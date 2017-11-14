require('dotenv').config()

const serverOptions = {
  connections: {
    router: {
      stripTrailingSlash: true
    }
  }
}
const Hapi = require('hapi')
const server = new Hapi.Server(serverOptions)
const Blipp = require('blipp');
const Disinfect = require('disinfect');
const SanitizePayload = require('hapi-sanitize-payload')


server.connection({
  port: process.env.PORT
})

server.state('sessionCookie', {
  ttl: 24 * 60 * 60 * 1000, // One day
  isSecure: false,
  isHttpOnly: false,
  isSameSite: 'Lax',
  encoding: 'base64json'
});




server.register([
  {
  // Session plugin
  register: require('hapi-server-session'),
  options: {
    cookie: {
      isSecure: false,
      isSameSite: false
    }
  }
},{
  // Plugin to display the routes table to console at startup
  // See https://www.npmjs.com/package/blipp
  register: Blipp,
  options: {
    showAuth: true
  }
}, {
  register: require('hapi-auth-cookie')
}, {
  // Plugin to prevent CSS attack by applying Google's Caja HTML Sanitizer on route query, payload, and params
  // See https://www.npmjs.com/package/disinfect
  register: Disinfect,
  options: {
    deleteEmpty: true,
    deleteWhitespace: true,
    disinfectQuery: true,
    disinfectParams: true,
    disinfectPayload: true
  }
}, {
  // Plugin to recursively sanitize or prune values in a request.payload object
  // See https://www.npmjs.com/package/hapi-sanitize-payload
  register: SanitizePayload,
  options: {
    pruneMethod: 'delete'
  }
}, require('inert'), require('vision')
], (err) => {



  server.auth.strategy('standard', 'cookie', {
    password: 'somecrazycookiesecretthatcantbeguesseswouldgohere', // cookie secret
    isSecure: false, // required for non-https applications
    isSameSite: 'Lax',
    ttl: 24 * 60 * 60 * 1000, // Set session to 1 day,
    redirectTo: '/signin',
    isHttpOnly: false
  });

  server.auth.default({
    strategy: 'standard',
    mode: 'try'
  });

  // load views
  server.views(require('./src/views'))
  // load routes
  server.route(require('./src/routes/public'))
  server.route(require('./src/routes/VmL'))


})

server.errorHandler = function(error) {
  throw error
}


server.ext({
  type: 'onPreHandler',
  method: function(request, reply) {

    //TODO: Define offline mechanisms - assuming s3 for now...

    var offline = false;


    if (offline && request.path.indexOf('public') == -1) {
      var viewContext = {}
      viewContext.session = request.session
      viewContext.pageTitle = 'Water Abstraction'
      viewContext.insideHeader = ''
      viewContext.headerClass = 'with-proposition'
      viewContext.topOfPage = null
      viewContext.head = null
      viewContext.bodyStart = null
      viewContext.afterHeader = null
      viewContext.path = request.path
      return reply.view('water/offline', viewContext)
    }
    return reply.continue();
  }
});
// Start the server
server.start((err) => {
  if (err) {
    throw err
  }
  console.log(`Service ${process.env.servicename} running at: ${server.info.uri}`)
})
module.exports = server
