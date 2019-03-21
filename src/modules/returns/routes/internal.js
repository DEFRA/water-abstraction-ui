const Joi = require('joi');
const controller = require('../controllers/internal');
const constants = require('../../../lib/constants');
const returns = constants.scope.returns;
const { VALID_GUID } = require('../../../lib/validators');

module.exports = {

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
          activeNavLink: 'view',
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
          activeNavLink: 'view',
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
          activeNavLink: 'view',
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
          activeNavLink: 'view',
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
          activeNavLink: 'view',
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
          activeNavLink: 'view',
          showMeta: false
        }
      }
    }
  },

  getDateReceived: {
    method: 'GET',
    path: '/admin/return/date-received',
    handler: controller.getDateReceived,
    options: {
      auth: {
        scope: returns
      },
      description: 'Show a page that declares the date a return was received',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'view',
          showMeta: false
        }
      }
    }
  },

  postDateReceived: {
    method: 'POST',
    path: '/admin/return/date-received',
    handler: controller.postDateReceived,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler - updates the received date of the return',
      validate: {
        query: {
          returnId: Joi.string().required()
        },
        payload: {
          'receivedDate-day': Joi.string().allow(''),
          'receivedDate-month': Joi.string().allow(''),
          'receivedDate-year': Joi.string().allow(''),
          csrf_token: Joi.string().guid()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'view',
          showMeta: false
        }
      }
    }
  },

  getInternalMethod: {
    method: 'GET',
    path: '/admin/return/internal-method',
    handler: controller.getInternalMethod,
    options: {
      auth: {
        scope: returns
      },
      description: 'Show a page that declares the date a return was received',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter date received',
          activeNavLink: 'view',
          showMeta: false
        },
        returns: true
      }
    }
  },

  postInternalMethod: {
    method: 'POST',
    path: '/admin/return/internal-method',
    handler: controller.postInternalMethod,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler - updates the selected measurement method',
      validate: {
        query: {
          returnId: Joi.string().required()
        },
        payload: {
          method: Joi.string(),
          csrf_token: Joi.string().guid()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter measurement method',
          activeNavLink: 'view',
          showMeta: false
        },
        returns: true
      }
    }
  },

  getMeterDetailsProvided: {
    method: 'GET',
    path: '/admin/return/meter/details-provided',
    handler: controller.getMeterDetailsProvided,
    options: {
      auth: {
        scope: returns
      },
      description: 'Show a page that declares the date a return was received',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are meter details provided',
          activeNavLink: 'view',
          showMeta: false
        },
        returns: true
      }
    }
  },

  postMeterDetailsProvided: {
    method: 'POST',
    path: '/admin/return/meter/details-provided',
    handler: controller.postMeterDetailsProvided,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler - updates if meter details are provided',
      validate: {
        query: {
          returnId: Joi.string().required()
        },
        payload: {
          meterDetailsProvided: Joi.string(),
          csrf_token: Joi.string().guid()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are meter details provided',
          activeNavLink: 'view',
          showMeta: false
        },
        returns: true
      }
    }
  },

  getSingleTotalAbstractionDates: {
    method: 'GET',
    path: '/admin/return/single-total-dates',
    handler: controller.getSingleTotalAbstractionPeriod,
    options: {
      auth: {
        scope: returns
      },
      description: 'Allow the user to select a default or custom abstraction period',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what period was used for this volume?',
          activeNavLink: 'view',
          showMeta: false
        },
        returns: true
      }
    }
  },

  postSingleTotalAbstractionDates: {
    method: 'POST',
    path: '/admin/return/single-total-dates',
    handler: controller.postSingleTotalAbstractionPeriod,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler - updates the period of abstraction for a volume',
      validate: {
        query: {
          returnId: Joi.string().required()
        },
        payload: {
          totalCustomDates: Joi.boolean().required(),
          csrf_token: Joi.string().guid().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what period was used for this abstraction?',
          activeNavLink: 'view',
          showMeta: false
        },
        returns: true
      }
    }
  }
};
