const Joi = require('@hapi/joi');

const controller = require('./controllers/wr22');
const { scope } = require('../../lib/constants');
const allowedScopes = [scope.abstractionReformUser, scope.abstractionReformApprover];

module.exports = {

  getSelectSchemaCategory: {
    method: 'GET',
    path: '/digitise/licence/{documentId}/select-schema-category',
    handler: controller.getSelectSchemaCategory,
    options: {
      pre: [{ method: controller.pre }],
      auth: { scope: allowedScopes },
      description: 'Select the WR22 schema category to begin adding WR22 data to licence',
      plugins: {
        viewContext: {
          pageTitle: 'Choose a further condition to add',
          activeNavLink: 'ar'
        }
      }
    }
  },

  postSelectSchemaCategory: {
    method: 'POST',
    path: '/digitise/licence/{documentId}/select-schema-category',
    handler: controller.postSelectSchemaCategory,
    options: {
      pre: [{ method: controller.pre }],
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

  getSelectSchema: {
    method: 'GET',
    path: '/digitise/licence/{documentId}/select-schema/{slug}',
    handler: controller.getSelectSchema,
    options: {
      pre: [{ method: controller.pre }],
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
    path: '/digitise/licence/{documentId}/select-schema/{slug}',
    handler: controller.postSelectSchema,
    options: {
      pre: [{ method: controller.pre }],
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
    path: '/digitise/licence/{documentId}/add-data/{schema*}',
    handler: controller.getAddData,
    options: {
      pre: [{ method: controller.pre }],
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
    path: '/digitise/licence/{documentId}/add-data/{schema*}',
    handler: controller.postAddData,
    options: {
      pre: [{ method: controller.pre }],
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
    path: '/digitise/licence/{documentId}/edit-data/{id}',
    handler: controller.getEditData,
    options: {
      pre: [{ method: controller.pre }],
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
    path: '/digitise/licence/{documentId}/edit-data/{id}',
    handler: controller.postEditData,
    options: {
      pre: [{ method: controller.pre }],
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
    path: '/digitise/licence/{documentId}/delete/{id}',
    handler: controller.getDeleteData,
    options: {
      pre: [{ method: controller.pre }],
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
    path: '/digitise/licence/{documentId}/delete/{id}',
    handler: controller.postDeleteData,
    options: {
      pre: [{ method: controller.pre }],
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
