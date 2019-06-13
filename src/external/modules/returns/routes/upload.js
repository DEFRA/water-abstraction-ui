const Joi = require('joi');
const { scope } = require('../../../lib/constants');
const controller = require('../controllers/upload');

const validators = require('shared/lib/validators');

const allowedScopes = [scope.licenceHolder, scope.colleagueWithReturns];

module.exports = {
  getXmlUpload: {
    method: 'GET',
    path: '/returns/upload',
    handler: controller.getXmlUpload,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Upload xml return',
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },
  postXmlUpload: {
    method: 'POST',
    path: '/returns/upload',
    handler: controller.postXmlUpload,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Upload xml return',
      payload: {
        output: 'stream',
        allow: 'multipart/form-data',
        maxBytes: 5e+7
      }
    }
  },

  getSpinnerPage: {
    method: 'GET',
    path: '/returns/processing-upload/{status}/{eventId}',
    handler: controller.getSpinnerPage,
    config: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: {
          status: Joi.string().valid(['processing', 'submitting']),
          eventId: Joi.string().guid()
        }
      },
      description: 'Uploading returns data',
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },

  getSummary: {
    method: 'GET',
    path: '/returns/upload-summary/{eventId}',
    handler: controller.getSummary,
    config: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: {
          eventId: validators.VALID_GUID
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },
  getSummaryReturn: {
    method: 'GET',
    path: '/returns/upload-summary/{eventId}/{returnId*}',
    handler: controller.getSummaryReturn,
    config: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: {
          eventId: validators.VALID_GUID,
          returnId: validators.VALID_RETURN_ID
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },

  postSubmit: {
    method: 'POST',
    path: '/returns/upload-submit/{eventId}',
    handler: controller.postSubmit,
    config: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: {
          eventId: validators.VALID_GUID
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },

  getSubmitted: {
    method: 'GET',
    path: '/returns/upload-submitted/{eventId}',
    handler: controller.getSubmitted,
    config: {
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: {
          eventId: validators.VALID_GUID
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },

  getCSVTemplates: {
    method: 'GET',
    path: '/returns/csv-templates',
    handler: controller.getCSVTemplates,
    config: {
      auth: {
        scope: allowedScopes
      }
    }
  },

  getUploadInstructions: {
    method: 'GET',
    path: '/returns/upload-instructions',
    handler: controller.getUploadInstructions,
    config: {
      auth: {
        scope: allowedScopes
      },
      plugins: {
        viewContext: {
          pageTitle: 'Sending returns in bulk',
          activeNavLink: 'returns'
        }
      }
    }
  }
};
