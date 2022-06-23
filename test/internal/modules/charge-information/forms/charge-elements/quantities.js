'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const {
  form,
  schema
} = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/quantities')
const { findField, findButton } = require('../../../../../lib/form-test')

const createRequest = chargeElements => ({
  view: {
    csrfToken: 'token'
  },
  query: {
    categoryId: ''
  },
  params: {
    licenceId: 'test-licence-id',
    elementId: 'test-element-id'
  },
  pre: {
    draftChargeInformation: {
      scheme: 'alcs',
      chargeElements: chargeElements || []
    }
  }
})

experiment('internal/modules/charge-information/forms/charge-element/quantities', () => {
  let quantitiesForm

  beforeEach(async () => {
    quantitiesForm = form(createRequest())
  })

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(quantitiesForm.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const csrf = findField(quantitiesForm, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('has a submit button', async () => {
      const button = findButton(quantitiesForm)
      expect(button.options.label).to.equal('Continue')
    })

    test('has a choice for using authorisedAnnualQuantity', async () => {
      const text = findField(quantitiesForm, 'authorisedAnnualQuantity')
      expect(text.options.label).to.equal('Authorised')
    })

    test('has a choice for using billableAnnualQuantity', async () => {
      const text = findField(quantitiesForm, 'billableAnnualQuantity')
      expect(text.options.label).to.equal('Billable (optional)')
    })

    test('sets the value of the authorisedAnnualQuantity, if provided', async () => {
      quantitiesForm = form(createRequest([{
        id: 'test-element-id',
        authorisedAnnualQuantity: 234
      }]))
      const quantityField = findField(quantitiesForm, 'authorisedAnnualQuantity')
      expect(quantityField.value).to.equal(234)
    })

    test('sets the value of the billableAnnualQuantity, if provided', async () => {
      quantitiesForm = form(createRequest([{
        id: 'test-element-id',
        billableAnnualQuantity: 123
      }]))
      const quantityField = findField(quantitiesForm, 'billableAnnualQuantity')
      expect(quantityField.value).to.equal(123)
    })
  })

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '1'
        }, { allowUnknown: true })
        expect(result.error).to.be.undefined()
      })

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          authorisedAnnualQuantity: '1'
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })
    })

    experiment('authorisedAnnualQuantity', () => {
      test('validates for a number string', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '123'
        }, { allowUnknown: true })
        expect(result.error).to.not.exist()
      })

      test('validates for a number string with 6 decimal places', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '132.123456'
        }, { allowUnknown: true })
        expect(result.error).to.not.exist()
      })

      test('must not have more than 6 decimal places', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '132.1234567'
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })

      test('must not be zero', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '0'
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })

      test('must be a number', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: 'asdasdasd'
        }, { allowUnknown: true })

        expect(result.error).to.exist()
      })

      test('can not be empty', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: ''
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })
    })
    experiment('billableAnnualQuantity', () => {
      test('validates for a string', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '132.123456',
          billableAnnualQuantity: '123'
        }, { allowUnknown: true })
        expect(result.error).to.not.exist()
      })

      test('cannot be a string describing -0.x', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '132.123456',
          billableAnnualQuantity: '-0.123'
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })

      test('validates for a string describing 0.x', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '132.123456',
          billableAnnualQuantity: '0.123'
        }, { allowUnknown: true })
        expect(result.error).to.not.exist()
      })

      test('can be empty', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          authorisedAnnualQuantity: '132.123456',
          billableAnnualQuantity: ''
        }, { allowUnknown: true })
        expect(result.error).not.to.exist()
      })
    })
  })
})
