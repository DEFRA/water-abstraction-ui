require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('good');
const GoodWinston = require('good-winston');
const Hapi = require('hapi');

// -------------- Require project code -----------------

// Initialise logger
const logger = require('./src/lib/logger');
const goodWinstonStream = new GoodWinston({ winston: logger });
logger.init({
  level: 'info',
  airbrakeKey: process.env.errbit_key,
  airbrakeHost: process.env.errbit_server,
  airbrakeLevel: 'error'
});

// Define server
const server = Hapi.server({
  port: process.env.PORT,
  router: {
    stripTrailingSlash: true
  }
});

/**
 * Async function to start HAPI server
 */
async function start () {
  // Blipp - lists all routes
  await server.register({
    plugin: Blipp,
    options: {
      showAuth: true
    }
  });

  // Good
  await server.register({
    plugin: Good,
    options: {
      ops: {
        interval: 60000
      },
      reporters: {
        winston: [goodWinstonStream]
      }
    }
  });

  await server.start();

  server.log(`Server started on port ${process.env.PORT}`);

  return server;
}

start();

module.exports = server;
