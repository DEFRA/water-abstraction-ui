const GoodWinston = require('good-winston');
const ResetPasswordConfig = require('shared/lib/ResetPasswordConfig');
const UpdatePasswordConfig = require('shared/lib/UpdatePasswordConfig');
const CatboxRedis = require('@hapi/catbox-redis');

const createPlugins = (config, logger, connectors) => ([
  require('@hapi/scooter'),
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
    plugin: require('@hapi/good'),
    options: { ...config.good,
      reporters: {
        winston: [new GoodWinston({ winston: logger })]
      }
    }
  },
  {
    plugin: require('@hapi/yar'),
    options: config.yar
  },
  {
    plugin: require('shared/plugins/reset-password'),
    options: new ResetPasswordConfig(config, connectors)
  },
  {
    plugin: require('shared/plugins/update-password'),
    options: new UpdatePasswordConfig(config, connectors)
  },
  {
    plugin: require('shared/plugins/service-status'),
    options: {
      services: connectors
    }
  }
]);

const createCache = config => {
  return [
    {
      name: 'redis',
      provider: {
        constructor: CatboxRedis,
        options: config.redis
      }
    }
  ];
};

exports.createPlugins = createPlugins;
exports.createCache = createCache;
