require('dotenv').config();
require('app-module-path').addPath(require('path').join(__dirname, 'src/'));

const { createPlugins } = require('./server-common');

// -------------- Require vendor code -----------------
const Hapi = require('@hapi/hapi');

// -------------- Require project code -----------------
const config = require('./src/external/config');
const plugins = require('./src/external/lib/hapi-plugins');
const routes = require('./src/external/modules/routes');
const viewEngine = require('./src/external/lib/view-engine/');
const { logger } = require('./src/external/logger');
const connectors = require('./src/external/lib/connectors/services');

const common = createPlugins(config, logger, connectors);

// Configure auth plugin
const AuthConfig = require('external/lib/AuthConfig');
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

/**
 * Async function to start HAPI server
 */
async function start () {
  try {
    await server.register(require('hapi-auth-cookie'));

    // Set up auth strategies
    server.auth.strategy('standard', 'cookie', {
      ...config.hapiAuthCookie,
      validateFunc: (request, data) => authConfig.validateFunc(request, data)
    });

    server.auth.default('standard');

    await server.register([...common, ...Object.values(plugins)]);

    await server.register([{
      plugin: require('shared/plugins/returns'),
      options: {
        getDocumentHeader: connectors.crm.documents.getWaterLicence.bind(connectors.crm.documents),
        checkAccess: true,
        includeExpired: false
      }
    }, {
      plugin: require('shared/plugins/licence-data'),
      options: require('external/lib/licence-data-config')
    }, {
      plugin: require('shared/plugins/view-licence'),
      options: require('external/lib/view-licence-config')
    },
    {
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
    }]);

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
    logger.info('stopping external ui');
    await server.stop();
    return process.exit(0);
  });

module.exports = server;
start();
