const GoodWinston = require('good-winston');
const ResetPasswordConfig = require('shared/lib/ResetPasswordConfig');
const LicenceDataConfig = require('external/lib/LicenceDataConfig');
const UpdatePasswordConfig = require('shared/lib/UpdatePasswordConfig');

const createPlugins = (config, logger, connectors) => ([
  require('@hapi/scooter'),
  require('hapi-auth-cookie'),
  require('@hapi/inert'),
  require('@hapi/vision'),
  {
    plugin: require('hapi-sanitize-payload'),
    options: config.sanitize
  },
  {
    plugin: require('blankie'),
    options: config.blankie
  },
  {
    plugin: require('blipp'),
    options: config.blipp
  },
  {
    plugin: require('good'),
    options: { ...config.good,
      reporters: {
        winston: [new GoodWinston({ winston: logger })]
      }
    }
  }, {
    plugin: require('@hapi/yar'),
    options: config.yar
  }, {
    plugin: require('shared/plugins/reset-password'),
    options: new ResetPasswordConfig(config, connectors)
  }, {
    plugin: require('shared/plugins/licence-data'),
    options: new LicenceDataConfig(config, connectors)
  }, {
    plugin: require('shared/plugins/update-password'),
    options: new UpdatePasswordConfig(config, connectors)
  }
]);

exports.createPlugins = createPlugins;
