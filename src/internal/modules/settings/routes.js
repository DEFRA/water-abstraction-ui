'use strict';

const controller = require('./controller');
const { createRoutePair } = require('shared/lib/route-helpers');
const { scope } = require('../../lib/constants');
const allowedScopes = [scope.manageApplicationSettings];
const preHandlers = require('./pre-handlers');

module.exports = {
  ...createRoutePair(controller, 'settings', {
    path: '/settings',
    options: {
      auth: {
        scope: allowedScopes
      },
      pre: [{
        method: preHandlers.getApplicationSettings, assign: 'applicationState'
      }],
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      }
    }
  })
};
