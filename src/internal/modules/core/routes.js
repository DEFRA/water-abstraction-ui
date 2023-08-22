'use strict'

const { VALID_UTM } = require('shared/lib/validators')
const controller = require('./controller')
const Joi = require('joi')

module.exports = {

  index: {
    method: 'GET',
    path: '/',
    handler: controller.index,
    config: {
      validate: {
        query: Joi.object(VALID_UTM)
      }
    }
  },

  404: {
    method: 'GET',
    path: '/{all*}',
    handler: controller.getNotFoundError,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      }
    }
  },

  status: {
    method: 'GET',
    path: '/status',
    handler: () => ({ status: 'alive' }),
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      }
    }
  }
}
