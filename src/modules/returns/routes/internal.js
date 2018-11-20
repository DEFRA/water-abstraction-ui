const Joi = require('joi');
const controller = require('../controllers/internal');
const constants = require('../../../lib/constants');
const returns = constants.scope.returns;
const { VALID_GUID } = require('../../../lib/validators');

module.exports = {

  getSearch: {
    method: 'GET',
    path: '/admin/returns',
    handler: controller.getSearch,
    options: {
      auth: {
        scope: returns
      },
      description: 'Search for return by format ID',
      plugins: {
        viewContext: {
          pageTitle: 'Process a return',
          activeNavLink: 'returns',
          showMeta: true
        }
      }
    }
  },

  getSelectLicence: {
    method: 'GET',
    path: '/admin/returns/select-licence',
    handler: controller.getSelectLicence,
    options: {
      auth: {
        scope: returns
      },
      description: 'Disambiguate format ID by licence number',
      plugins: {
        viewContext: {
          pageTitle: 'Select a licence',
          activeNavLink: 'returns',
          showMeta: true
        }
      }
    }
  },

  getInternalRouting: {
    method: 'GET',
    path: '/admin/return/internal',
    handler: controller.getInternalRouting,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form to route internal user to return flows',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what do you want to do with this return?',
          activeNavLink: 'returns',
          showMeta: true
        }
      }
    }
  },

  postInternalRouting: {
    method: 'POST',
    path: '/admin/return/internal',
    handler: controller.postInternalRouting,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form handler for internal routing',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what do you want to do with this return?',
          activeNavLink: 'returns',
          showMeta: true
        },
        formValidator: {
          payload: {
            csrf_token: VALID_GUID
          }
        }
      }
    }
  },

  getLogReceipt: {
    method: 'GET',
    path: '/admin/return/log-receipt',
    handler: controller.getLogReceipt,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form to log return as received',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'returns',
          showMeta: false
        }
      }
    }
  },

  postLogReceipt: {
    method: 'POST',
    path: '/admin/return/log-receipt',
    handler: controller.postLogReceipt,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler - logs return as received',
      validate: {
        query: {
          returnId: Joi.string().required()
        },
        payload: {
          'date_received-day': Joi.string().allow(''),
          'date_received-month': Joi.string().allow(''),
          'date_received-year': Joi.string().allow(''),
          csrf_token: Joi.string().guid()
        }

      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'returns',
          showMeta: false
        }
      }
    }
  },

  getReceiptLogged: {
    method: 'GET',
    path: '/admin/return/receipt-logged',
    handler: controller.getReceiptLogged,
    options: {
      auth: {
        scope: returns
      },
      description: 'Success page for log receipt of return flow',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return received',
          activeNavLink: 'returns',
          showMeta: false
        }
      }
    }
  },

  getQueryLogged: {
    method: 'GET',
    path: '/admin/return/query-logged',
    handler: controller.getQueryLogged,
    options: {
      auth: {
        scope: returns
      },
      description: 'Success page for set/clear under query flag',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return query received',
          activeNavLink: 'returns',
          showMeta: false
        }
      }
    }
  }
};
