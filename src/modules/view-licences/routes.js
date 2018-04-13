const Joi = require('joi');
const controller = require('./controller');
const admin = require('./admin');

module.exports = {
  getLicences: {
    method: 'GET',
    path: '/licences',
    handler: controller.getLicences,
    config: {
      description: 'View list of licences with facility to sort/filter',
      validate: {
        query: {
          sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
          direction: Joi.number().valid(1, -1).default(1),
          emailAddress: Joi.string().allow('').max(254),
          licenceNumber: Joi.string().allow('').max(32),
          page: Joi.number().allow('').min(1).default(1)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Your licences',
          customTitle: 'Your water abstraction or impoundment licences',
          showResults: true
        },
        formValidator: {
          query: {
            emailAddress: Joi.string().allow('').email(),
            licenceNumber: Joi.string().allow('')
          }
        }
      }
    }
  },
  getLicence: {
    method: 'GET',
    path: '/licences/{licence_id}',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View a single licence',
      validate: {
        params: {
          licence_id: Joi.string().required().guid()
        }
      },
      plugins: {
        config: {
          view: 'water/view-licences/licence'
        }
      }
    }
  },

  getLicenceRename: {
    method: 'GET',
    path: '/licences/{licence_id}/rename',
    handler: controller.getLicenceDetail,
    config: {
      description: 'Set user-defined name for licence',
      validate: {
        params: {
          licence_id: Joi.string().required().guid()
        }
      },
      plugins: {
        config: {
          view: 'water/view-licences/rename'
        }
      }
    }
  },
  postLicenceRename: {
    method: 'POST',
    path: '/licences/{licence_id}',
    handler: controller.postLicenceRename,
    config: {
      description: 'Update the user-defined licence name',
      validate: {
        params: {
          licence_id: Joi.string().required().guid()
        },
        payload: {
          name: Joi.string().max(32),
          csrf_token: Joi.string().guid().required()
        }
      },
      plugins: {
        config: {
          view: 'water/view-licences/rename'
        }
      }
    }
  },
  getLicenceContact: {
    method: 'GET',
    path: '/licences/{licence_id}/contact',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View contact info for licence',
      validate: {
        params: {
          licence_id: Joi.string().required().guid()
        }
      },
      plugins: {
        config: {
          view: 'water/view-licences/contact'
        }
      }
    }
  },
  getLicenceConditions: {
    method: 'GET',
    path: '/licences/{licence_id}/conditions',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View abstraction conditions info for licence',
      validate: {
        params: {
          licence_id: Joi.string().required().guid()
        }
      },
      plugins: {
        config: {
          view: 'water/view-licences/conditions'
        }
      }
    }
  },

  getLicencePoints: {
    method: 'GET',
    path: '/licences/{licence_id}/points',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View abstraction points for licence',
      validate: {
        params: {
          licence_id: Joi.string().required().guid()
        }
      },
      plugins: {
        config: {
          view: 'water/view-licences/points'
        }
      }
    }
  },

  getLicencePurposes: {
    method: 'GET',
    path: '/licences/{licence_id}/purposes',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View abstraction purposes for licence',
      validate: {
        params: {
          licence_id: Joi.string().required().guid()
        }
      },
      plugins: {
        config: {
          view: 'water/view-licences/purposes'
        }
      }
    }
  },

  // ------------------- Admin routes ---------------------
  getLicencesAdmin: {
    method: 'GET',
    path: '/admin/licences',
    handler: admin.getLicences,
    config: {
      description: 'View list of licences with facility to sort/filter',
      validate: {
        query: {
          sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
          direction: Joi.number().valid(1, -1).default(1),
          emailAddress: Joi.string().allow('').max(254),
          licenceNumber: Joi.string().allow('').max(32),
          page: Joi.number().allow('').min(1).default(1)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Licences',
          customTitle: 'Water abstraction or impoundment licences',
          enableSearch: true,
          showEmailFilter: true,
          isAdmin: true
        },
        formValidator: {
          query: {
            emailAddress: Joi.string().allow('').email(),
            licenceNumber: Joi.string().allow('')
          }
        }
      }
    }
  }

};
