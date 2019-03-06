const { scope } = require('../../../lib/constants');
const controller = require('../controllers/upload');

const validators = require('../../../lib/validators');

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
        allow: 'multipart/form-data'
      }
    }
  },
  getSpinnerPage: {
    method: 'GET',
    path: '/returns/processing-upload/{event_id}',
    handler: controller.getSpinnerPage,
    config: {
      auth: {
        scope: allowedScopes
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
  }
};
