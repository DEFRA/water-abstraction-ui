require('dotenv').config();

const serverOptions = {
  connections: {
    router: {
      stripTrailingSlash: true
    }
  }
};
const Hapi = require('hapi');

const server = new Hapi.Server(serverOptions);
const SanitizePayload = require('hapi-sanitize-payload');

server.connection({
  port: process.env.PORT
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
    register: require('node-hapi-airbrake-js'),
    options: {
      key: process.env.errbit_key,
      host: process.env.errbit_server
    }
  },

  {
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
    // Session handling via water service
    register: require('./src/lib/sessions/hapi-plugin.js'),
    options: {}
  },
  {
    register: require('hapi-route-acl'),
    options: {
      permissionsFunc: require('./src/lib/permissions.js').getPermissionsCb
    }
  },
  {
    // Permissions handling
    register: require('./src/lib/permissions.js').plugin,
    options: {}
  },
  {
    // Custom error handling
    register: require('./src/lib/hapi-error-plugin.js'),
    options: {}
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
  if (err) {
    console.error(err);
  }

  server.auth.strategy('standard', 'cookie', {
    password: process.env.cookie_secret, // cookie secret
    isSecure: !!(process.env.NODE_ENV || '').match(/^dev|test|production|preprod$/i),
    isSameSite: 'Lax',
    ttl: 24 * 60 * 60 * 1000, // Set session to 1 day,
    redirectTo: '/signin',
    isHttpOnly: true
  });

  // server.auth.default('standard');
  server.auth.default({
    strategy: 'standard',
    mode: 'try'
  });

  // load views
  server.views(require('./src/views'));
  // load routes
  server.route(require('./src/routes/public'));
  server.route(require('./src/routes/VmL'));
});

server.errorHandler = function (error) {
  throw error;
};

server.ext({
  type: 'onPreHandler',
  method (request, reply) {





    if (request.path.indexOf('public') !== -1) {
      // files in public dir are always online...
      return reply.continue();
    } else if (request.path === '/robots.txt') {
      // robots.txt is always online because it's used for ELB healthcheck...
      return reply.continue();
    }




    // removed s3 status file check since it's leaking memory...
    return reply.continue();
  }
});


/**
server.ext({
  type: 'onPreHandler',
  method (request, reply) {
    if (request.path.indexOf('public') !== -1) {
      // files in public dir are always online...
      return reply.continue();
    } else if (request.path === '/robots.txt') {
      // robots.txt is always online because it's used for ELB healthcheck...
      return reply.continue();
    } else {
    }
    return reply.continue();
  }
});
**/

server.ext({
  type: 'onPostHandler',
  method (request, reply) {
      request.response.headers['X-Frame-Options']='DENY';
      return reply.continue();
  }
});

// Start the server if not testing with Lab
if (!module.parent) {
  server.start((err) => {
    if (err) {
      throw err;
    }
    console.log(`Service ${process.env.servicename} running at: ${server.info.uri}`);
  });
}
module.exports = server;
