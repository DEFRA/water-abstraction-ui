require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('good');
const GoodWinston = require('good-winston');
const Hapi = require('hapi');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiSanitizePayload = require('hapi-sanitize-payload');
const Inert = require('inert');
const Vision = require('vision');
const HapiAuthJWT2 = require('hapi-auth-jwt2');
const Blankie = require('blankie');
const Scooter = require('scooter');

// -------------- Require project code -----------------
const config = require('./config');
const { acl, ...plugins } = require('./src/lib/hapi-plugins');
const { getPermissions: permissionsFunc } = require('./src/lib/permissions.js');
const routes = require('./src/modules/routes');
const returnsPlugin = require('./src/modules/returns/plugin.js');

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
    await server.register([Scooter, {
      plugin: Blankie,
      options: config.blankie
    }]);

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
      plugin: acl,
      options: {
        permissionsFunc
      }
    });

    await server.register(Object.values(plugins));

    await server.register({ plugin: returnsPlugin });

    // Set up auth strategies
    server.auth.strategy('standard', 'cookie', {
      ...config.hapiAuthCookie
    });
    if (config.testMode) {
      await server.register({
        plugin: HapiAuthJWT2
      });
      server.auth.strategy('jwt', 'jwt', {
        ...config.jwt,
        validate: async (decoded) => ({isValid: !!decoded.id})
      });
    }

    server.auth.default('standard');

    // Set up view location
    server.views(require('./src/views'));

    // Import routes
    server.route(routes);

    await server.start();

    server.log(['info'], `Server started on ${server.info.uri} port ${server.info.port}`);
  } catch (err) {
    logger.error('Failed to start server', err);
  }

  return server;
}

module.exports = server;
start();
