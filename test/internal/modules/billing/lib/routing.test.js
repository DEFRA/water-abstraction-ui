'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const { getBillingBatchRoute } = require('internal/modules/billing/lib/routing')

experiment('internal/modules/billing/lib/routing', () => {
  experiment('.getBillingBatchRoute', () => {
    const batch = { id: '59203fa0-41d5-44c3-994e-032dc0985ea1' }

    experiment('when batch status is "processing"', () => {
      beforeEach(() => {
        batch.status = 'processing'
      })

      test('returns the processing batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/billing/batch/${batch.id}/processing`)
      })
    })

    experiment('when batch status is "sending"', () => {
      beforeEach(() => {
        batch.status = 'sending'
      })

      test('returns the processing batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/billing/batch/${batch.id}/processing`)
      })
    })

    experiment('when batch status is "ready"', () => {
      beforeEach(() => {
        batch.status = 'ready'
      })

      experiment('and an invoice Id is not set', () => {
        test('returns the summary batch page url', () => {
          const result = getBillingBatchRoute(batch)

          expect(result).to.equal(`/system/bill-runs/${batch.id}`)
        })
      })

      experiment('and an invoice Id is set', () => {
        test('returns the invoice batch page url', () => {
          const options = {
            invoiceId: '9683aba6-39ab-4b2d-885c-542ff864dbe9'
          }
          const result = getBillingBatchRoute(batch, options)

          expect(result).to.equal(`/system/bills/${options.invoiceId}`)
        })
      })
    })

    experiment('when batch status is "sent"', () => {
      beforeEach(() => {
        batch.status = 'sent'
      })

      experiment('and show success page is not set', () => {
        test('returns the summary batch page url', () => {
          const result = getBillingBatchRoute(batch)

          expect(result).to.equal(`/system/bill-runs/${batch.id}`)
        })
      })

      experiment('and show success page is set', () => {
        test('returns the success batch page url', () => {
          const result = getBillingBatchRoute(batch, { showSuccessPage: true })

          expect(result).to.equal(`/billing/batch/${batch.id}/confirm/success`)
        })
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

      experiment('when the bill-run is a two part tariff sroc scheme', () => {
        beforeEach(() => {
          batch.scheme = 'sroc'
          batch.type = 'two_part_tariff'
        })

        test('returns the system review url', () => {
          const result = getBillingBatchRoute(batch)

          expect(result).to.equal(`/system/bill-runs/${batch.id}/review`)
        })
      })
    })

    experiment('when batch status is "empty"', () => {
      beforeEach(() => {
        batch.status = 'empty'
      })

      test('returns the empty batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/system/bill-runs/${batch.id}`)
      })
    })

    experiment('when batch status is "error"', () => {
      beforeEach(() => {
        batch.status = 'error'
      })

      test('returns the error batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/system/bill-runs/${batch.id}`)
      })
    })

    experiment('when batch status is "queued"', () => {
      beforeEach(() => {
        batch.status = 'queued'
      })

      test('returns the processing batch page url', () => {
        const result = getBillingBatchRoute(batch)

        expect(result).to.equal(`/billing/batch/${batch.id}/processing`)
      })
    })
  })
})
