'use strict';

const { createPreHandler } = require('shared/lib/pre-handlers/forms');

const controller = require('./controller');
const preHandlers = require('./pre-handlers');

const { charging } = require('internal/lib/constants').scope;
const allowedScopes = [charging];

const forms = require('./forms');

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
      }, {
        method: createPreHandler(forms.ukPostcode), assign: 'postcodeForm'
      }, {
        method: createPreHandler(forms.selectAddress), assign: 'selectAddressForm'
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
      }, {
        method: createPreHandler(forms.ukPostcode), assign: 'postcodeForm'
      }, {
        method: createPreHandler(forms.selectAddress), assign: 'selectAddressForm'
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
      }, {
        method: createPreHandler(forms.manualAddressEntry), assign: 'form'
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
      }, {
        method: createPreHandler(forms.manualAddressEntry), assign: 'form'
      }]
    }
  },

  getSelectCompanyAddress: {
    method: 'GET',
    path: '/address-entry/{key}/select-company-address',
    handler: controller.getSelectCompanyAddress,
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
      }, {
        method: createPreHandler(forms.selectCompanyAddress), assign: 'form'
      }]
    }
  },

  postSelectCompanyAddress: {
    method: 'POST',
    path: '/address-entry/{key}/select-company-address',
    handler: controller.postSelectCompanyAddress,
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
      }, {
        method: createPreHandler(forms.selectCompanyAddress), assign: 'form'
      }]
    }
  },

  getUseRegisteredOfficeAddress: {
    method: 'get',
    path: '/address-entry/{key}/use-registered-address',
    handler: controller.getUseRegisteredAddress,
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
      },
      {
        method: createPreHandler(forms.useRegisteredAddress), assign: 'form'
      }]
    }
  },

  postUseRegisteredOfficeAddress: {
    method: 'post',
    path: '/address-entry/{key}/use-registered-address',
    handler: controller.postUseRegisteredAddress,
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
      },
      {
        method: createPreHandler(forms.useRegisteredAddress), assign: 'form'
      }]
    }
  }
};
