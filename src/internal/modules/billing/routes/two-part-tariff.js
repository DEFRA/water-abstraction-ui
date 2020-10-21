'use strict';
const Joi = require('@hapi/joi');
const controller = require('../controllers/two-part-tariff');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'preprod'].includes(process.env.NODE_ENV);
const preHandlers = require('../pre-handlers');

const { VALID_GUID } = require('shared/lib/validators');

const pre = [
  { method: preHandlers.loadBatch, assign: 'batch' },
  { method: preHandlers.checkBatchStatusIsReview }
];

if (isAcceptanceTestTarget) {
  module.exports = {
    getBillingTwoPartTariffReview: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-review',
      handler: controller.getTwoPartTariffReview,
      config: {
        pre,
        auth: { scope: allowedScopes },
        description: 'view list of 2PT returns data matching issues',
        plugins: {
          viewContext: {
            pageTitle: 'Review licences with returns data issues',
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID
          }
        }
      }
    },
    getBillingTwoPartTariffReady: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff-ready',
      handler: controller.getTwoPartTariffViewReady,
      config: {
        pre,
        auth: { scope: allowedScopes },
        description: 'view list of 2PT licences ready for billing',
        plugins: {
          viewContext: {
            pageTitle: 'View licences ready for billing',
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID
          }
        }
      }
    },
    getLicenceReview: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/{action}',
      handler: controller.getLicenceReview,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadLicence, assign: 'licence' }
        ],
        auth: { scope: allowedScopes },
        description: 'review a single licence within a 2PT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            licenceId: VALID_GUID,
            action: Joi.string().allow(['review', 'view']).required()
          }
        }
      }
    },
    getBillingVolumeReview: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}',
      handler: controller.getBillingVolumeReview,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadLicence, assign: 'licence' },
          { method: preHandlers.loadBillingVolume, assign: 'billingVolume' }
        ],
        auth: { scope: allowedScopes },
        description: 'review billing volume quantities in TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            licenceId: VALID_GUID,
            billingVolumeId: VALID_GUID
          }
        }
      }
    },

    postBillingVolumeReview: {
      method: 'POST',
      path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}',
      handler: controller.postBillingVolumeReview,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadLicence, assign: 'licence' },
          { method: preHandlers.loadBillingVolume, assign: 'billingVolume' }
        ],
        auth: { scope: allowedScopes },
        description: 'review billing volume quantities in TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            licenceId: VALID_GUID,
            billingVolumeId: VALID_GUID
          }
        }
      }
    },

    getConfirmQuantity: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}/confirm',
      handler: controller.getConfirmQuantity,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadLicence, assign: 'licence' },
          { method: preHandlers.loadBillingVolume, assign: 'billingVolume' }
        ],
        auth: { scope: allowedScopes },
        description: 'review billing volume quantities in TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            licenceId: VALID_GUID,
            billingVolumeId: VALID_GUID
          },
          query: {
            quantity: Joi.number().min(0).required()
          }
        }
      }
    },

    postConfirmQuantity: {
      method: 'POST',
      path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/billing-volume/{billingVolumeId}/confirm',
      handler: controller.postConfirmQuantity,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadLicence, assign: 'licence' },
          { method: preHandlers.loadBillingVolume, assign: 'billingVolume' }
        ],
        auth: { scope: allowedScopes },
        description: 'confirm review billing volume in TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            licenceId: VALID_GUID,
            billingVolumeId: VALID_GUID
          },
          payload: {
            csrf_token: VALID_GUID,
            quantity: Joi.number().min(0).required()
          }
        }
      }
    },

    getRemoveLicence: {
      method: 'GET',
      path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/remove',
      handler: controller.getRemoveLicence,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadLicence, assign: 'licence' }
        ],
        auth: { scope: allowedScopes },
        description: 'confirm remove licence from TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            licenceId: VALID_GUID
          }
        }
      }
    },

    postRemoveLicence: {
      method: 'POST',
      path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}/remove',
      handler: controller.postRemoveLicence,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadLicence, assign: 'licence' }
        ],
        auth: { scope: allowedScopes },
        description: 'confirm remove licence from TPT batch',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID,
            licenceId: VALID_GUID
          }
        }
      }
    },

    getApproveReview: {
      method: 'GET',
      path: '/billing/batch/{batchId}/approve-review',
      handler: controller.getApproveReview,
      config: {
        pre: [
          ...pre,
          { method: preHandlers.loadBatch, assign: 'batch' }
        ],
        auth: { scope: allowedScopes },
        description: 'approve tpt review to continue bill run',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID
          }
        }
      }
    },

    postApproveReview: {
      method: 'POST',
      path: '/billing/batch/{batchId}/approve-review',
      handler: controller.postApproveReview,
      config: {
        pre: [
          ...pre
        ],
        auth: { scope: allowedScopes },
        description: 'approve tpt review to continue bill run',
        plugins: {
          viewContext: {
            activeNavLink: 'notifications'
          }
        },
        validate: {
          params: {
            batchId: VALID_GUID
          }
        }
      }
    }

  };
};
