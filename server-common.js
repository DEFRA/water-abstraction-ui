const GoodWinston = require('good-winston');
const ResetConfig = require('./src/shared/lib/ResetConfig');

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
    options: new ResetConfig(config, connectors)
  }
]);

exports.createPlugins = createPlugins;
