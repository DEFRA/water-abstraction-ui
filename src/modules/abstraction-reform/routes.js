const Joi = require('joi');
const controller = require('./controllers/edit');
const reportsController = require('./controllers/reports');
const wr22Controller = require('./controllers/wr22');
const statuses = require('./lib/statuses');
const { scope } = require('../../lib/constants');
const allowedScopes = [scope.abstractionReformUser, scope.abstractionReformApprover];

module.exports = {

  getViewLicences: {
    method: 'GET',
    path: '/admin/abstraction-reform',
    handler: controller.getViewLicences,
    options: {
      auth: { scope: allowedScopes },
      description: 'Entrance search page for abstraction reform',
      validate: {
        query: {
          page: Joi.number().default(1),
          q: Joi.string().allow('')
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Review licence data',
          activeNavLink: 'ar'
        }
      }
    }
  },

  getViewLicence: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}',
    handler: controller.getViewLicence,
    options: {
      auth: { scope: allowedScopes },
      description: 'Page to view comparison of permit repo licence with AR version',
      plugins: {
        viewContext: {
          pageTitle: 'Review licence data',
          activeNavLink: 'ar',
          back: '/admin/abstraction-reform'
        }
      }
    }
  },

  getEditObject: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}/edit/{type}/{id?}',
    handler: controller.getEditObject,
    options: {
      auth: { scope: allowedScopes },
      description: 'Edit an object within the licence',
      plugins: {
        viewContext: {
          pageTitle: 'Edit',
          activeNavLink: 'ar'
        }
      }
    }
  },

  postEditObject: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/edit/{type}/{id?}',
    handler: controller.postEditObject,
    options: {
      auth: { scope: allowedScopes },
      description: 'Post handler: edit an object within the licence'
    }
  },

  postSetStatus: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/status',
    handler: controller.postSetStatus,
    options: {
      auth: { scope: allowedScopes },
      description: 'Post handler: set document status',
      plugins: {
        formValidator: {
          payload: {
            csrf_token: Joi.string().guid(),
            notes: Joi.string().allow(''),
            status: Joi.string().required().valid(Object.values(statuses))
          }
        }
      }
    }
  },

  getCSVReport: {
    method: 'GET',
    path: '/admin/abstraction-reform/report',
    handler: reportsController.getCSVReport,
    options: {
      auth: { scope: scope.abstractionReformApprover },
      description: 'Page to allow download of abstraction reform CSV report',
      plugins: {
        viewContext: {
          pageTitle: 'Abstraction reform report',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  getSelectSchema: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}/select-schema',
    handler: wr22Controller.getSelectSchema,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'Add a WR22 data point to existing licence',
      plugins: {
        viewContext: {
          pageTitle: 'Choose a further condition to add',
          activeNavLink: 'ar'
        }
      }
    }
  },

  postSelectSchema: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/select-schema',
    handler: wr22Controller.postSelectSchema,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'Add a WR22 data point to existing licence - post handler',
      plugins: {
        viewContext: {
          pageTitle: 'Choose a further condition to add',
          activeNavLink: 'ar'
        }
      }
    }
  },

  getAddData: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}/add-data/{schema*}',
    handler: wr22Controller.getAddData,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'Add a WR22 data point to existing licence - data form',
      plugins: {
        viewContext: {
          pageTitle: 'Link data to this condition',
          activeNavLink: 'ar'
        }
      }
    }
  },

  postAddData: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/add-data/{schema*}',
    handler: wr22Controller.postAddData,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'Add a WR22 data point to existing licence - data form',
      plugins: {
        viewContext: {
          pageTitle: 'Link data to this condition',
          activeNavLink: 'ar'
        }
      }
    }
  },

  getEditData: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}/edit-data/{id}',
    handler: wr22Controller.getEditData,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'Add a WR22 data point to existing licence - data form',
      validate: {
        params: {
          documentId: Joi.string().guid(),
          id: Joi.string().guid()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Link data to this condition',
          activeNavLink: 'ar'
        }
      }
    }
  },

  postEditData: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/edit-data/{id}',
    handler: wr22Controller.postEditData,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'POST handler for editing a WR22 data point to existing licence',
      validate: {
        params: {
          documentId: Joi.string().guid(),
          id: Joi.string().guid()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Link data to this condition',
          activeNavLink: 'ar'
        }
      }
    }
  },

  getDeleteData: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}/delete/{id}',
    handler: wr22Controller.getDeleteData,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'Delete a WR22 data point from licence',
      validate: {
        params: {
          documentId: Joi.string().guid(),
          id: Joi.string().guid()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Remove condition',
          activeNavLink: 'ar'
        }
      }
    }
  },

  postDeleteData: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/delete/{id}',
    handler: wr22Controller.postDeleteData,
    options: {
      pre: [{ method: wr22Controller.pre }],
      auth: { scope: allowedScopes },
      description: 'POST handler - delete a WR22 data point from licence',
      validate: {
        params: {
          documentId: Joi.string().guid(),
          id: Joi.string().guid()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Remove condition',
          activeNavLink: 'ar'
        }
      }
    }
  }

};
