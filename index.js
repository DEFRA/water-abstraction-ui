require('dotenv').config()


/**
request.cookieAuth.set(user);

**/

const serverOptions = {
  connections: {
    router: {
      stripTrailingSlash: true
    }
  }
}
const Hapi = require('hapi')
const server = new Hapi.Server(serverOptions)
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


// logging options
const goodOptions = {
    ops: {
        interval: 1000
    },
    reporters: {
        myConsoleReporter: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' }]
        }, {
            module: 'good-console'
        }, 'stdout']
    }
};


server.register([
  {
    register: require('good'),
    options: goodOptions
  },

  {
  register: require('hapi-error'),
  options : {
    templateName : 'water/error.html',
    statusCodes : {
      401 : {
        redirect : '/login'
      }
    }
  }
},
{
    register: require('node-hapi-airbrake'),
    options: {
      key: process.env.errbit_key,
      host: process.env.errbit_server
    }
  },


  {
    // Session plugin
    register: require('hapi-server-session'),
    options: {
      cookie: {
        isSecure: false,
        isSameSite: false
      }
    }
  }, {
    // Plugin to display the routes table to console at startup
    // See https://www.npmjs.com/package/blipp
    register: require('blipp'),
    options: {
      showAuth: true
    }
  }, {
    register: require('hapi-auth-cookie')
  },
  {
    // Plugin to recursively sanitize or prune values in a request.payload object
    // See https://www.npmjs.com/package/hapi-sanitize-payload
    register: SanitizePayload,
    options: {
      pruneMethod: 'delete'
    }
  },

  require('inert'), require('vision')
], (err) => {

  server.auth.strategy('standard', 'cookie', {
    password: process.env.cookie_secret, // cookie secret
    isSecure: process.env.NODE_ENV == 'production', // use secure cookie in production
    isSameSite: 'Lax',
    ttl: 24 * 60 * 60 * 1000, // Set session to 1 day,
    redirectTo: '/signin',
    isHttpOnly: true,
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

    if (request.path.indexOf('public') != -1) {
      //files in public dir are always online...
      return reply.continue();
    } else if (request.path == '/robots.txt') {
      //robots.txt is always online because it's used for ELB healthcheck...
      return reply.continue();

    } else {
      //removed s3 status file check since it's leaking memory...
      return reply.continue();
    }
  }
});



// Start the server if not testing with Lab
if (!module.parent) {
  server.start((err) => {
    if (err) {
      throw err
    }
    console.log(`Service ${process.env.servicename} running at: ${server.info.uri}`)
  })
}
module.exports = server
