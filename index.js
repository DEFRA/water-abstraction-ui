require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('good');
const GoodWinston = require('good-winston');
const Hapi = require('hapi');
const HapiAuthCookie = require('hapi-auth-cookie');

// -------------- Require project code -----------------
const config = require('./config');
const { acl, csrf, sessions, permissions } = require('./src/lib/hapi-plugins');
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
    // Good
    await server.register({
      plugin: Good,
      options: { ...config.good,
        reporters: {
          winston: [goodWinstonStream]
        }
      }
    });

    // Blipp - lists all routes
    await server.register({
      plugin: Blipp,
      options: config.blipp
    });

    // Hapi auth cookie
    await server.register({
      plugin: HapiAuthCookie
    });

    // Route ACL
    await server.register({
      plugin: acl,
      options: {
        permissionsFunc
      }
    });

    // App plugins
    await server.register({ plugin: sessions });
    await server.register({ plugin: csrf });
    await server.register({ plugin: permissions });

    // Set up auth strategies
    server.auth.strategy('standard', 'cookie', config.hapiAuthCookie);
    server.auth.default(config.auth);

    await server.start();

    server.log(`Server started on ${server.info.uri} port ${server.info.port}`);
  } catch (err) {
    logger.error(err);
  }

  return server;
}

start();

module.exports = server;
