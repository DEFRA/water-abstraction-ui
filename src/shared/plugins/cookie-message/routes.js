'use strict';

const Joi = require('@hapi/joi');
const { createRoutePair } = require('shared/lib/route-helpers');
const controller = require('./controller');

const redirectPath = Joi
  .string()
  .regex(/^\/[^/].*/)
  .uri({ relativeOnly: true })
  .max(256);

module.exports = {
  ...createRoutePair(controller, 'cookies', {
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
          redirectPath,
          form: Joi.string().guid().optional()
        })
      }
    }
  }),
  getSetCookiePreferences: {
    path: '/set-cookie-preferences',
    method: 'get',
    handler: controller.getSetCookiePreferences,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      description: 'View cookie details and set choices',
      validate: {
        query: Joi.object({
          acceptAnalytics: Joi.boolean().truthy('true').falsy('false'),
          redirectPath
        })
      }
    }
  }
};
