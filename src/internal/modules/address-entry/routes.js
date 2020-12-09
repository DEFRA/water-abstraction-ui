'use strict';
const { createRoutePair } = require('shared/lib/route-helpers');

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

  ...createRoutePair(controller, 'manualAddressEntry', {
    path: '/address-entry/{key}/manual-entry',
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
  }),

  ...createRoutePair(controller, 'selectCompanyAddress', {
    path: '/address-entry/{key}/select-company-address',
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Select an existing company address',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      }, {
        method: preHandlers.getCompanyAddresses, assign: 'addresses'
      }, {
        method: preHandlers.getCompany, assign: 'company'
      }]
    }
  }),

  ...createRoutePair(controller, `useRegisteredAddress`, {
    path: '/address-entry/{key}/use-registered-address',
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'Whether to use registered company address',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      pre: [{
        method: preHandlers.getSessionData, assign: 'sessionData'
      },
      {
        method: preHandlers.getCompaniesHouseCompany, assign: 'company'
      }]
    }
  })

};
