const Joi = require('joi');
const controller = require('./controller');
const admin = require('./admin');
const { VALID_GUID, VALID_LICENCE_QUERY, VALID_LICENCE_NAME } = require('../../lib/validators');

const getLicence = {
  method: 'GET',
  path: '/licences/{licence_id}',
  handler: controller.getLicenceDetail,
  config: {
    description: 'View a single licence',
    validate: {
      params: {
        licence_id: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'water/view-licences/licence'
      },
      viewContext: {
        activeNavLink: 'view'
      }
    }
  }
};

const getLicenceRename = {
  method: 'GET',
  path: '/licences/{licence_id}/rename',
  handler: controller.getLicenceDetail,
  config: {
    description: 'Set user-defined name for licence',
    validate: {
      params: {
        licence_id: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'water/view-licences/rename'
      },
      viewContext: {
        activeNavLink: 'view'
      }
    }
  }
};

const postLicenceRename = {
  method: 'POST',
  path: '/licences/{licence_id}',
  handler: controller.postLicenceRename,
  config: {
    description: 'Update the user-defined licence name',
    validate: {
      params: {
        licence_id: VALID_GUID
      },
      payload: {
        name: Joi.string().allow('').max(32),
        csrf_token: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'water/view-licences/rename'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      formValidator: {
        payload: {
          name: VALID_LICENCE_NAME,
          csrf_token: VALID_GUID
        }
      }
    }
  }
};

module.exports = {
  getLicences: {
    method: 'GET',
    path: '/licences',
    handler: controller.getLicences,
    config: {
      description: 'View list of licences with facility to sort/filter',
      validate: {
        query: VALID_LICENCE_QUERY
      },
      plugins: {
        viewContext: {
          pageTitle: 'Your licences',
          customTitle: 'Your water abstraction or impoundment licences',
          showResults: true,
          activeNavLink: 'view'
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
  getLicence,
  getLicenceRename,
  postLicenceRename,
  getLicenceContact: {
    method: 'GET',
    path: '/licences/{licence_id}/contact',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View contact info for licence',
      validate: {
        params: {
          licence_id: VALID_GUID
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
          licence_id: VALID_GUID
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
          licence_id: VALID_GUID
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
          licence_id: VALID_GUID
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
      description: 'Admin: view list of licences with facility to sort/filter',
      validate: {
        query: VALID_LICENCE_QUERY
      },
      plugins: {
        viewContext: {
          pageTitle: 'Licences',
          customTitle: 'Water abstraction or impoundment licences',
          enableSearch: true,
          showEmailFilter: true,
          activeNavLink: 'view'
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

  getLicenceAdmin: {
    ...getLicence,
    path: '/admin/licences/{licence_id}'
  },
  getLicenceRenameAdmin: {
    ...getLicenceRename,
    path: '/admin/licences/{licence_id}/rename'
  },
  postLicenceRenameAdmin: {
    ...postLicenceRename,
    path: '/admin/licences/{licence_id}',
    config: {
      ...postLicenceRename.config,
      plugins: {
        ...postLicenceRename.config.plugins,
        config: {
          ...postLicenceRename.config.plugins.config,
          redirectBasePath: '/admin/licences'
        }
      }
    }
  }

};
