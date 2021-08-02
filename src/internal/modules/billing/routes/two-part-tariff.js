'use strict';
const Joi = require('joi');
const controller = require('../controllers/two-part-tariff');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];
const preHandlers = require('../pre-handlers');

const { VALID_GUID } = require('shared/lib/validators');

const pre = [
  { method: preHandlers.loadBatch, assign: 'batch' },
  { method: preHandlers.checkBatchStatusIsReview }
];

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
          pageTitle: 'Review data issues',
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: VALID_GUID
        })
      }
    }
  },
  getLicenceReview: {
    method: 'GET',
    path: '/billing/batch/{batchId}/two-part-tariff/licence/{licenceId}',
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
        params: Joi.object().keys({
          batchId: VALID_GUID,
          licenceId: VALID_GUID
        })
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
        params: Joi.object().keys({
          batchId: VALID_GUID,
          licenceId: VALID_GUID,
          billingVolumeId: VALID_GUID
        })
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
        params: Joi.object().keys({
          batchId: VALID_GUID,
          licenceId: VALID_GUID,
          billingVolumeId: VALID_GUID
        })
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
        params: Joi.object().keys({
          batchId: VALID_GUID,
          licenceId: VALID_GUID
        })
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
        params: Joi.object().keys({
          batchId: VALID_GUID,
          licenceId: VALID_GUID
        })
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
        params: Joi.object().keys({
          batchId: VALID_GUID
        })
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
        params: Joi.object().keys({
          batchId: VALID_GUID
        })
      }
    }
  }
};
