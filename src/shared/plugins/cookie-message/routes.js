'use strict';

const Joi = require('@hapi/joi');
const { createRoutePair } = require('shared/lib/route-helpers');
const controller = require('./controller');

module.exports = createRoutePair(controller, 'cookies', {
  path: '/cookies',
  config: {
    auth: {
      strategy: 'standard',
      mode: 'try'
    },
    description: 'View cookie details and set choices',
    plugins: {
      viewContext: {
        pageTitle: 'Cookies'
      }
    },
    validate: {
      query: Joi.object({
        redirectPath: Joi.string().max(256).optional(),
        form: Joi.string().guid().optional()
      })
    }
  }
});
