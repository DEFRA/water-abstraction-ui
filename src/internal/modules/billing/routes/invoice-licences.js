'use strict';

const Joi = require('@hapi/joi');

const { createRoutePair } = require('shared/lib/route-helpers');
const controller = require('../controllers/invoice-licences');
const preHandlers = require('../pre-handlers');
const { billing } = require('../../../../internal/lib/constants').scope;
const allowedScopes = [billing];

module.exports = {

  ...createRoutePair(controller, 'deleteInvoiceLicence', {
    path: '/billing/batch/{batchId}/invoice/{invoiceId}/delete-licence/{invoiceLicenceId}',
    config: {
      auth: { scope: allowedScopes },
      description: 'Request confirmation to remove invoice from bill run',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      },
      validate: {
        params: {
          batchId: Joi.string().uuid(),
          invoiceId: Joi.string().uuid(),
          invoiceLicenceId: Joi.string().uuid()
        }
      },
      pre: [
        { method: preHandlers.loadBatch, assign: 'batch' },
        { method: preHandlers.loadInvoice, assign: 'invoice' },
        preHandlers.checkBatchStatusIsReady,
        { method: preHandlers.loadInvoiceLicence, assign: 'invoiceLicence' }
      ]
    }
  })
};
