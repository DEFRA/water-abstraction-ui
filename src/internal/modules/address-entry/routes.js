'use strict';

const controller = require('./controller');
const preHandlers = require('./pre-handlers');

const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

module.exports = {
  getPostcode: {
    method: 'GET',
    path: '/address-entry/{key}/postcode',
    handler: controller.getPostcode,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Enter UK postcode',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.searchForAddressesByPostcode, assign: 'addressSearchResults'
      }]
    }
  },

  postSelectAddress: {
    method: 'POST',
    path: '/address-entry/{key}/postcode',
    handler: controller.postSelectAddress,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select address from address options',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.searchForAddressesByPostcode, assign: 'addressSearchResults'
      }]
    }
  },

  getManualAddressEntry: {
    method: 'GET',
    path: '/address-entry/{key}/manual-entry',
    handler: controller.getManualAddressEntry,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Enter address manually',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }]
    }
  },

  postManualAddressEntry: {
    method: 'POST',
    path: '/address-entry/{key}/manual-entry',
    handler: controller.postManualAddressEntry,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Enter address manually',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }]
    }
  }
};
