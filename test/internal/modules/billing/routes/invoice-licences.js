'use strict'

const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()
const preHandlers = require('internal/modules/billing/pre-handlers')
const { scope } = require('internal/lib/constants')
const routes = require('internal/modules/billing/routes/invoice-licences')

experiment('internal/modules/billing/routes/invoice-licences', () => {
  experiment('.getDeleteInvoiceLicence', () => {
    test('uses the loadBatch pre handler', async () => {
      const routePreHandlers = routes.getDeleteInvoiceLicence.config.pre
      expect(routePreHandlers[0]).to.equal({ method: preHandlers.loadBatch, assign: 'batch' })
    })

    test('uses the loadInvoice pre handler', async () => {
      const routePreHandlers = routes.getDeleteInvoiceLicence.config.pre
      expect(routePreHandlers[1]).to.equal({ method: preHandlers.loadInvoice, assign: 'invoice' })
    })

    test('uses the checkBatchStatusIsReady pre handler', async () => {
      const routePreHandlers = routes.getDeleteInvoiceLicence.config.pre
      expect(routePreHandlers[2]).to.equal(preHandlers.checkBatchStatusIsReady)
    })

    test('requires the "billing" scope', async () => {
      expect(routes.getDeleteInvoiceLicence.config.auth.scope)
        .to.only.include(scope.billing)
    })
  })

  experiment('.postDeleteInvoiceLicence', () => {
    test('uses the loadBatch pre handler', async () => {
      const routePreHandlers = routes.postDeleteInvoiceLicence.config.pre
      expect(routePreHandlers[0]).to.equal({ method: preHandlers.loadBatch, assign: 'batch' })
    })

    test('uses the loadInvoice pre handler', async () => {
      const routePreHandlers = routes.postDeleteInvoiceLicence.config.pre
      expect(routePreHandlers[1]).to.equal({ method: preHandlers.loadInvoice, assign: 'invoice' })
    })

    test('uses the checkBatchStatusIsReady pre handler', async () => {
      const routePreHandlers = routes.postDeleteInvoiceLicence.config.pre
      expect(routePreHandlers[2]).to.equal(preHandlers.checkBatchStatusIsReady)
    })

    test('requires the "billing" scope', async () => {
      expect(routes.postDeleteInvoiceLicence.config.auth.scope)
        .to.only.include(scope.billing)
    })
  })
})
