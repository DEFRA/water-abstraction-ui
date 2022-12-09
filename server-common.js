'use strict'

const HapiPinoPlugin = require('./src/shared/plugins/hapi-pino.plugin.js')
const ResetPasswordConfig = require('shared/lib/ResetPasswordConfig')
const UpdatePasswordConfig = require('shared/lib/UpdatePasswordConfig')
const CatboxRedis = require('@hapi/catbox-redis')

const createPlugins = (config, connectors) => {
  const plugins = [
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
      plugin: require('shared/lib/session-forms').plugin
    }
  ]

  plugins.push(HapiPinoPlugin(config.log.logInTest, config.log.logAssetRequests))

  return plugins
}

const createCache = config => {
  return [
    {
      provider: {
        constructor: CatboxRedis,
        options: config.redis
      }
    }
  ]
}

exports.createPlugins = createPlugins
exports.createCache = createCache
