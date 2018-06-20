require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('good');
const GoodWinston = require('good-winston');
const Hapi = require('hapi');
const HapiAuthCookie = require('hapi-auth-cookie');
const hapiRouteAcl = require('hapi-route-acl');
const HapiSanitizePayload = require('hapi-sanitize-payload');
const Inert = require('inert');
const Vision = require('vision');

// -------------- Require project code -----------------
const config = require('./config');
const plugins = require('./src/lib/hapi-plugins');
const { getPermissionsCb: permissionsFunc } = require('./src/lib/permissions.js');

// Initialise logger
const logger = require('./src/lib/logger');
const goodWinstonStream = new GoodWinston({ winston: logger });
logger.init(config.logger);

// Define server
const server = Hapi.server(config.server);

/**
 * Async function to start HAPI server
 */
async function start () {
  try {
    // Third-party plugins
    await server.register({
      plugin: Good,
      options: { ...config.good,
        reporters: {
          winston: [goodWinstonStream]
        }
      }
    });
    await server.register({
      plugin: Blipp,
      options: config.blipp
    });
    await server.register({
      plugin: HapiAuthCookie
    });
    await server.register({
      plugin: HapiSanitizePayload,
      options: config.sanitize
    });
    await server.register([Inert, Vision]);

    // App plugins
    await server.register({
      plugin: hapiRouteAcl,
      options: {
        permissionsFunc
      }
    });
    await server.register(Object.values(plugins));

    // Set up auth strategies
    server.auth.strategy('standard', 'cookie', config.hapiAuthCookie);
    server.auth.default(config.auth);

    // Set up view location
    server.views(require('./src/views'));

    // Import routes
    server.route(require('./src/routes/VmL'));

    await server.start();

    server.log(`Server started on ${server.info.uri} port ${server.info.port}`);
  } catch (err) {
    logger.error(err);
  }

  return server;
}

start();

module.exports = server;
