'use strict'

const Joi = require('joi')
const controller = require('../controllers/bill-run')
const { billing } = require('../../../../internal/lib/constants').scope
const allowedScopes = [billing]
const preHandlers = require('../pre-handlers')

const { featureToggles } = require('../../../config')

const routes = {

  getBillingBatchSummary: {
    method: 'GET',
    path: '/billing/batch/{batchId}/summary',
    handler: controller.getBillingBatchSummary,
    config: {
      app: {
        validBatchStatuses: ['ready', 'sent']
      },
      auth: { scope: allowedScopes },
      description: 'displays the bill run summary',
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        }),
        query: Joi.object().keys({
          back: Joi.number().integer().default(1).optional()
        })
      },
      pre: [
        { method: preHandlers.loadBatch, assign: 'batch' },
        { method: preHandlers.redirectOnBatchStatus }
      ]
    }
  },

  getBillingBatchInvoice: {
    method: 'GET',
    path: '/billing/batch/{batchId}/invoice/{invoiceId}',
    handler: controller.getBillingBatchInvoice,
    config: {
      auth: { scope: allowedScopes },
      description: 'displays the invoice for a specific bill run',
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid(),
          invoiceId: Joi.string().uuid()
        })
      }
    }
  },

  getBillingBatchList: {
    method: 'GET',
    path: '/billing/batch/list',
    handler: controller.getBillingBatchList,
    config: {
      auth: { scope: allowedScopes },
      description: 'displays a list of past bill runs',
      plugins: {
        viewContext: {
          pageTitle: 'Bill runs',
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        query: Joi.object().keys({
          page: Joi.number().integer().min(1).default(1)
        })
      }
    }
  },

  getBillingBatchConfirm: {
    method: 'GET',
    path: '/billing/batch/{batchId}/confirm',
    handler: controller.getBillingBatchConfirm,
    config: {
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      },
      pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
    }
  },

  postBillingBatchConfirm: {
    method: 'POST',
    path: '/billing/batch/{batchId}/confirm',
    handler: controller.postBillingBatchConfirm,
    config: {
      auth: { scope: allowedScopes },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid().required()
        }),
        payload: Joi.object().keys({
          csrf_token: Joi.string().uuid().required()
        })
      }
    }
  },

  getBillingBatchConfirmSuccess: {
    method: 'GET',
    path: '/billing/batch/{batchId}/confirm/success',
    handler: controller.getBillingBatchConfirmSuccess,
    config: {
      app: {
        validBatchStatuses: ['sent']
      },
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      },
      pre: [
        { method: preHandlers.loadBatch, assign: 'batch' },
        { method: preHandlers.redirectOnBatchStatus }
      ]
    }
  },

  getBillingBatchCancel: {
    method: 'GET',
    path: '/billing/batch/{batchId}/cancel',
    handler: controller.getBillingBatchCancel,
    config: {
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      },
      pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
    }
  },

  postBillingBatchCancel: {
    method: 'POST',
    path: '/billing/batch/{batchId}/cancel',
    handler: controller.postBillingBatchCancel,
    config: {
      auth: { scope: allowedScopes },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid().required()
        }),
        payload: Joi.object().keys({
          csrf_token: Joi.string().uuid().required()
        })
      }
    }
  },

  getBillingBatchStatusToCancel: {
    method: 'GET',
    path: '/billing/batch/{batchId}/cancel/processing-batch',
    handler: controller.getBillingBatchStatusToCancel,
    config: {
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      },
      pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
    }
  },

  postBillingBatchStatusToCancel: {
    method: 'POST',
    path: '/billing/batch/{batchId}/cancel/processing-batch',
    handler: controller.postBillingBatchStatusToCancel,
    config: {
      auth: { scope: allowedScopes },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid().required()
        }),
        payload: Joi.object().keys({
          csrf_token: Joi.string().uuid().required()
        })
      }
    }
  },

  getTransactionsCSV: {
    method: 'GET',
    path: '/billing/batch/{batchId}/transactions-csv',
    handler: controller.getTransactionsCSV,
    config: {
      auth: { scope: allowedScopes },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid().required()
        })
      },
      pre: [{ method: preHandlers.loadBatch, assign: 'batch' }]
    }
  },

  getBillingBatchDeleteInvoice: {
    method: 'GET',
    path: '/billing/batch/{batchId}/delete-invoice/{invoiceId}',
    handler: controller.getBillingBatchDeleteInvoice,
    config: {
      auth: { scope: allowedScopes },
      description: 'Request confirmation to remove invoice from bill run',
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid(),
          invoiceId: Joi.string().uuid()
        }),
        query: Joi.object().keys({
          originalInvoiceId: Joi.string().uuid().optional(),
          rebillInvoiceId: Joi.string().uuid().optional()
        })
      },
      pre: [
        { method: preHandlers.loadBatch, assign: 'batch' },
        { method: preHandlers.loadInvoice, assign: 'invoice' },
        preHandlers.checkBatchStatusIsReady
      ]
    }
  },

  postBillingBatchDeleteInvoice: {
    method: 'POST',
    path: '/billing/batch/{batchId}/delete-invoice/{invoiceId}',
    handler: controller.postBillingBatchDeleteInvoice,
    config: {
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid(),
          invoiceId: Joi.string().uuid()
        }),
        payload: Joi.object().keys({
          originalInvoiceId: Joi.string().uuid().optional(),
          rebillInvoiceId: Joi.string().uuid().optional(),
          csrf_token: Joi.string().uuid().required()
        })
      }
    }
  },

  getBillingBatchProcessing: {
    method: 'GET',
    path: '/billing/batch/{batchId}/processing',
    handler: controller.getBillingBatchProcessing,
    config: {
      app: {
        validBatchStatuses: ['queued', 'processing', 'sending']
      },
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        }),
        query: Joi.object().keys({
          back: Joi.number().integer().default(1).optional(),
          invoiceId: Joi.string().uuid().optional()
        })
      },
      pre: [
        { method: preHandlers.loadBatch, assign: 'batch' },
        { method: preHandlers.redirectOnBatchStatus }
      ]
    }
  },

  getBillingBatchEmpty: {
    method: 'GET',
    path: '/billing/batch/{batchId}/empty',
    handler: controller.getBillingBatchEmpty,
    config: {
      app: {
        validBatchStatuses: ['empty']
      },
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      },
      pre: [
        { method: preHandlers.loadBatch, assign: 'batch' },
        { method: preHandlers.redirectOnBatchStatus }
      ]
    }
  },

  getBillingBatchError: {
    method: 'GET',
    path: '/billing/batch/{batchId}/error',
    handler: controller.getBillingBatchError,
    config: {
      app: {
        validBatchStatuses: ['error']
      },
      auth: { scope: allowedScopes },
      plugins: {
        viewContext: {
          activeNavLink: 'bill-runs'
        }
      },
      validate: {
        params: Joi.object().keys({
          batchId: Joi.string().uuid()
        })
      },
      pre: [
        { method: preHandlers.loadBatch, assign: 'batch' },
        { method: preHandlers.redirectOnBatchStatus }
      ]
    }
  }
}

if (featureToggles.deleteAllBillingData) {
  routes.postDeleteAllBillingData = {
    method: 'POST',
    path: '/billing/batch/delete-all-data',
    handler: controller.postDeleteAllBillingData,
    config: {
      auth: { scope: allowedScopes }
    }
  }
}

module.exports = routes
