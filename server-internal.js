require('dotenv').config();
require('app-module-path').addPath(require('path').join(__dirname, 'src/'));

const { createPlugins } = require('./server-common');

// -------------- Require vendor code -----------------
const Hapi = require('@hapi/hapi');

// -------------- Require project code -----------------
const config = require('./src/internal/config');
const plugins = require('./src/internal/lib/hapi-plugins');
const routes = require('./src/internal/modules/routes');
const viewEngine = require('./src/internal/lib/view-engine/');
const { logger } = require('./src/internal/logger');
const connectors = require('./src/internal/lib/connectors/services');

const common = createPlugins(config, logger, connectors);

// Configure auth plugin
const AuthConfig = require('internal/lib/AuthConfig');
const authConfig = new AuthConfig(config, connectors);
const authPlugin = {
  plugin: require('shared/plugins/auth'),
  options: authConfig
};

// Define server with REST API cache mechanism
// @TODO replace with redis
const server = Hapi.server({
  ...config.server,
  cache: {
    provider: require('shared/lib/catbox-rest-api')
  }
});

const pluginsArray = [
  ...common,
  ...Object.values(plugins),
  {
    plugin: require('shared/plugins/returns'),
    options: {
      getDocumentHeader: connectors.crm.documents.getWaterLicence.bind(connectors.crm.documents),
      checkAccess: false,
      includeExpired: true
    }
  }, {
    plugin: require('shared/plugins/licence-data'),
    options: require('internal/lib/licence-data-config')
  }, {
    plugin: require('shared/plugins/view-licence'),
    options: require('internal/lib/view-licence-config')
  }, {
    plugin: require('shared/plugins/flow')
  }, {
    plugin: require('shared/plugins/reauth'),
    options: {
      reauthenticate: connectors.idm.users.reauthenticate.bind(connectors.idm.users)
    }
  }, {
    plugin: require('shared/plugins/error'),
    options: {
      logger,
      contextDefaults: require('./src/external/lib/view').contextDefaults
    }
  }
];

/**
 * Async function to start HAPI server
 */
async function start () {
  try {
    await server.register(require('hapi-auth-cookie'));

    server.auth.strategy('standard', 'cookie', {
      ...config.hapiAuthCookie,
      validateFunc: (request, data) => authConfig.validateFunc(request, data)
    });

    server.auth.default('standard');

    await server.register(pluginsArray);

    // Set up Nunjucks view engine
    server.views(viewEngine);

    // Auth plugin
    await server.register(authPlugin);

    server.route(routes);

    await server.start();

    server.log(['info'], `Server started on ${server.info.uri} port ${server.info.port}`);
  } catch (err) {
    logger.error('Failed to start server', err);
  }

  return server;
}

const processError = message => err => {
  logger.error(message, err);
  process.exit(1);
};

process
  .on('unhandledRejection', processError('unhandledRejection'))
  .on('uncaughtException', processError('uncaughtException'))
  .on('SIGINT', async () => {
    logger.info('stopping internal ui');
    await server.stop();
    return process.exit(0);
  });

module.exports = server;
start();
