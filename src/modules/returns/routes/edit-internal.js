const Joi = require('joi');
const controller = require('../controllers/edit');
const constants = require('../../../lib/constants');
const returns = constants.scope.returns;
const { VALID_GUID } = require('../../../lib/validators');
const { upperFirst } = require('lodash');

const getHandlerName = (method, path, pathExclude) => {
  return method.toLowerCase() + path.replace(pathExclude, '').split('/').map(upperFirst).join('');
};

const createMeterRoute = (method, path, description) => {
  return {
    method,
    path,
    handler: controller[getHandlerName(method, path, '/admin/return/')],
    options: {
      auth: { scope: returns },
      description,
      plugins: {
        viewContext: { activeNavLink: 'returns' },
        returns: true
      }
    }
  };
};

const createGetMeterRoute = createMeterRoute.bind(null, 'GET');
const createPostMeterRoute = createMeterRoute.bind(null, 'POST');

module.exports = {
  getAmounts: {
    method: 'GET',
    path: '/admin/return',
    handler: controller.getAmounts,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form to start the return process for a return, asks if nil return',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are there any abstraction amounts to report?',
          activeNavLink: 'returns',
          showMeta: true
        }
      }
    }
  },
  postAmounts: {
    method: 'POST',
    path: '/admin/return',
    handler: controller.postAmounts,
    options: {
      auth: {
        scope: returns
      },
      description: 'Form handler for nil returns',
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are there any abstraction amounts to report?',
          activeNavLink: 'returns',
          showMeta: true
        },
        formValidator: {
          payload: {
            csrf_token: VALID_GUID,
            isNil: Joi.string().required().valid('Yes', 'No')
          }
        },
        returns: true
      }
    }
  },

  getNilReturn: {
    method: 'GET',
    path: '/admin/return/nil-return',
    handler: controller.getNilReturn,
    options: {
      auth: {
        scope: returns
      },
      description: 'Confirmation screen for nil return',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - submit nil',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  postNilReturn: {
    method: 'POST',
    path: '/admin/return/nil-return',
    handler: controller.postNilReturn,
    options: {
      auth: {
        scope: returns
      },
      description: 'Post handler for nil return',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - nil submitted',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getSubmitted: {
    method: 'GET',
    path: '/admin/return/submitted',
    handler: controller.getSubmitted,
    options: {
      auth: {
        scope: returns
      },
      description: 'Confirmation screen for nil return',
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getMethod: {
    method: 'GET',
    path: '/admin/return/method',
    handler: controller.getMethod,
    options: {
      auth: {
        scope: returns
      },
      description: 'Ask whether meter readings are used',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - how are you reporting your return?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  postMethod: {
    method: 'POST',
    path: '/admin/return/method',
    handler: controller.postMethod,
    options: {
      auth: {
        scope: returns
      },
      description: 'POST handler for meter readings routing',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - how are you reporting your return?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getUnits: {
    method: 'GET',
    path: '/admin/return/units',
    handler: controller.getUnits,
    options: {
      auth: {
        scope: returns
      },
      description: 'Get units used for this return',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what is the unit of measurement?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  postUnits: {
    method: 'POST',
    path: '/admin/return/units',
    handler: controller.postUnits,
    options: {
      auth: {
        scope: returns
      },
      description: 'Post handler for units used for this return',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - what is the unit of measurement?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getSingleTotal: {
    method: 'GET',
    path: '/admin/return/single-total',
    handler: controller.getSingleTotal,
    options: {
      auth: {
        scope: returns
      },
      description: 'Get whether a single total was submitted for this return',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - is it a single amount?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  postSingleTotal: {
    method: 'POST',
    path: '/admin/return/single-total',
    handler: controller.postSingleTotal,
    options: {
      auth: {
        scope: returns
      },
      description: 'Post handler for single total submitted for this return',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - is it a single amount?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getBasis: {
    method: 'GET',
    path: '/admin/return/basis',
    handler: controller.getBasis,
    options: {
      auth: {
        scope: returns
      },
      description: 'Get basis for supplied return data',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are you using estimates?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  postBasis: {
    method: 'POST',
    path: '/admin/return/basis',
    handler: controller.postBasis,
    options: {
      auth: {
        scope: returns
      },
      description: 'Post handler for records basis',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - are you using estimates?',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getQuantities: {
    method: 'GET',
    path: '/admin/return/quantities',
    handler: controller.getQuantities,
    options: {
      auth: {
        scope: returns
      },
      description: 'Display quantities form',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter amounts',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  postQuantities: {
    method: 'POST',
    path: '/admin/return/quantities',
    handler: controller.postQuantities,
    options: {
      auth: {
        scope: returns
      },
      description: 'Post handler for quantities',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - enter amounts',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getConfirm: {
    method: 'GET',
    path: '/admin/return/confirm',
    handler: controller.getConfirm,
    options: {
      auth: {
        scope: returns
      },
      description: 'Display confirmation screen of returned quantities',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - check the information before submitting',
          activeNavLink: 'returns',
          showMeta: true
        },
        returns: true
      }
    }
  },

  postConfirm: {
    method: 'POST',
    path: '/admin/return/confirm',
    handler: controller.postConfirm,
    options: {
      auth: {
        scope: returns
      },
      description: 'Post handler for confirmation screen',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction return - check the information before submitting',
          activeNavLink: 'returns'
        },
        returns: true
      }
    }
  },

  getMeterDetails: createGetMeterRoute(
    '/admin/return/meter/details',
    'Shows the view allowing an admin user to enter meter details'
  ),

  postMeterDetails: createPostMeterRoute(
    '/admin/return/meter/details',
    'POST handler for meter details'
  ),

  getMeterUnits: createGetMeterRoute(
    '/admin/return/meter/units',
    'Shows the view allowing an admin user to enter meter units'
  ),

  postMeterUnits: createPostMeterRoute(
    '/admin/return/meter/units',
    'POST handler for meter units'
  ),

  getMeterReadings: createGetMeterRoute(
    '/admin/return/meter/readings',
    'Shows the view allowing an admin user to enter meter readings'
  ),

  postMeterReadings: createPostMeterRoute(
    '/admin/return/meter/readings',
    'POST handler for meter readings'
  )

};
