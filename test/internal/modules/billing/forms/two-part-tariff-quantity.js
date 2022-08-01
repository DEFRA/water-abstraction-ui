'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const { v4: uuid } = require('uuid')
const { expect } = require('@hapi/code')

const { schema } = require('../../../../../src/internal/modules/billing/forms/two-part-tariff-quantity')

experiment('internal/modules/billing/forms/two-part-tariff-quantity', () => {
  experiment('schema', () => {
    let transaction
    let tptSchema

    beforeEach(async () => {
      transaction = {
        chargeElement: {
          authorisedAnnualQuantity: 1,
          billableAnnualQuantity: 2,
          maxAnnualQuantity: 3
        }
      }

      tptSchema = schema(transaction)
    })

    experiment('csrf_token', () => {
      test('can be a uuid', async () => {
        const result = tptSchema.validate({
          csrf_token: uuid(),
          quantity: 'authorised'
        })
        expect(result.error).to.be.undefined()
      })

      test('cannot be a non uuid', async () => {
        const result = tptSchema.validate({
          csrf_token: 'thighs',
          quantity: 'authorised'
        })
        expect(result.error).to.exist()
      })

      test('is required', async () => {
        const result = tptSchema.validate({
          csrf_token: null,
          quantity: 'authorised'
        })
        expect(result.error).to.exist()
      })
    })

    experiment('quantity', () => {
      test('can be "authorised"', async () => {
        const result = tptSchema.validate({
          csrf_token: uuid(),
          quantity: 'authorised'
        })
        expect(result.error).to.be.undefined()
      })

      experiment('can be "custom', () => {
        test('as long as customQuantity is defined', () => {
          const experiment1 = tptSchema.validate({
            csrf_token: uuid(),
            quantity: 'custom',
            customQuantity: '2'
          })
          expect(experiment1.error).to.be.undefined()

          const experiment2 = tptSchema.validate({
            csrf_token: uuid(),
            quantity: 'custom'
          })
          expect(experiment2.error.details[0].type).to.equal('any.required')
        })
      })

      test('cannot be another value', async () => {
        const result = tptSchema.validate({
          csrf_token: uuid(),
          quantity: 'Cypress Hill'
        })
        expect(result.error.details[0].type).to.equal('any.only')
      })

      test('is required', async () => {
        const result = tptSchema.validate({
          csrf_token: uuid(),
          quantity: null
        })
        expect(result.error.details[0].type).to.equal('any.only')
      })
    })

    experiment('customQuantity', () => {
      const getData = ({ customQuantity }) => ({
        csrf_token: uuid(),
        quantity: 'custom',
        customQuantity
      })

      experiment('when the quantity is of type "custom', () => {
        test('the customQuantity cannot be less than 0', async () => {
          const data = getData({ customQuantity: '-1' })
          const result = tptSchema.validate(data)
          expect(result.error.details[0].type).to.equal('number.min')
        })

        test('the customQuantity cannot be greater than the maxAnnualQuantity', async () => {
          const data = getData({ customQuantity: '4' })
          const result = tptSchema.validate(data)
          expect(result.error.details[0].type).to.equal('number.max')
        })

        test('the customQuantity can equal the maxAnnualQuantity', async () => {
          const data = getData({ customQuantity: '3' })
          const result = tptSchema.validate(data)
          expect(result.error).to.be.undefined()
        })

        test('the customQuantity can be greater than zero and less that the maxAnnualQuantity', async () => {
          const data = getData({ customQuantity: '2' })
          const result = tptSchema.validate(data)
          expect(result.error).to.be.undefined()
        })

        test('the customQuantity can have up to 6 decimal places', async () => {
          const data = getData({ customQuantity: '2.123456' })
          const result = tptSchema.validate(data)
          expect(result.error).to.be.undefined()
        })

        test('the customQuantity cannot have more than 6 decimal places', async () => {
          const data = getData({ customQuantity: '2.1234567' })
          const result = tptSchema.validate(data)
          expect(result.error.details[0].type).to.equal('number.custom')
        })
      })
    })
  })
})
