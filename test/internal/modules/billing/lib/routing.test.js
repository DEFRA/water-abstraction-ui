'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { getBillingBatchRoute } = require('internal/modules/billing/lib/routing')

experiment.only('internal/modules/billing/lib/routing', () => {
  experiment('.getBillingBatchRoute', () => {
    const batch = { id: '59203fa0-41d5-44c3-994e-032dc0985ea1' }

    experiment('when batch status is "processing"', () => {
      beforeEach(() => {
        batch.status = 'processing'
      })

      test('returns the processing batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.startWith(`/billing/batch/${batch.id}/processing`)
      })

      test('sets back query param to 0 by default', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.endWith('?back=0')
      })

      test('sets back query param to 1 when isBackEnabled is true', () => {
        const result = getBillingBatchRoute(batch, { isBackEnabled: true })

        expect(result).to.endWith('?back=1')
      })
    })

    experiment('when batch status is "ready"', () => {
      beforeEach(() => {
        batch.status = 'ready'
      })

      test('returns the batch summary url if no invoice ID is supplied', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/billing/batch/${batch.id}/summary`)
      })

      test('returns the invoice page if an invoice ID is supplied', () => {
        const options = {
          invoiceId: '9683aba6-39ab-4b2d-885c-542ff864dbe9'
        }
        const result = getBillingBatchRoute(batch, options)

        expect(result).to.equal(`/billing/batch/${batch.id}/invoice/${options.invoiceId}`)
      })
    })

    experiment('when batch status is "sent"', () => {
      beforeEach(() => {
        batch.status = 'sent'
      })

      test('returns the summary url by default', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/billing/batch/${batch.id}/summary`)
      })

      test('returns success page url when showSuccessPage flag is true', () => {
        expect(getBillingBatchRoute(batch, { showSuccessPage: true })).to.equal(`/billing/batch/${batch.id}/confirm/success`)
      })
    })

    experiment('when batch status is "review"', () => {
      beforeEach(() => {
        batch.status = 'review'
      })

      test('returns the two part tariff review url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/billing/batch/${batch.id}/two-part-tariff-review`)
      })
    })

    experiment('when batch status is "empty"', () => {
      beforeEach(() => {
        batch.status = 'empty'
      })

      test('returns the empty batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.startWith(`/billing/batch/${batch.id}/empty`)
      })
    })

    experiment('when batch status is "error"', () => {
      beforeEach(() => {
        batch.status = 'error'
      })

      test('returns the error batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.startWith(`/billing/batch/${batch.id}/error`)
      })
    })
  })
})
