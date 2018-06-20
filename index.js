require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('good');
const GoodWinston = require('good-winston');
const Hapi = require('hapi');
const HapiAuthCookie = require('hapi-auth-cookie');

// -------------- Require project code -----------------
const config = require('./config');

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

  // Set up auth strategies
  server.auth.strategy('standard', 'cookie', config.hapiAuthCookie);
  server.auth.default(config.auth);

  await server.start();

  server.log(`Server started on ${server.info.uri} port ${server.info.port}`);

  return server;
}

start();

module.exports = server;
