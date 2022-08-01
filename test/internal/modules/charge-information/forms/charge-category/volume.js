'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const {
  form,
  schema
} = require('../../../../../../src/internal/modules/charge-information/forms/charge-category/volume')
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
      chargeElements: chargeElements || []
    }
  }
})

experiment('internal/modules/charge-information/forms/charge-category/volume', () => {
  let volumeForm

  beforeEach(async () => {
    volumeForm = form(createRequest())
  })

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(volumeForm.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const csrf = findField(volumeForm, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('has a submit button', async () => {
      const button = findButton(volumeForm)
      expect(button.options.label).to.equal('Continue')
    })

    test('can enter the volume in a text field', async () => {
      const text = findField(volumeForm, 'volume')
      expect(text.name).to.equal('volume')
      expect(text.options.type).to.equal('text')
    })

    test('the volume text field should have the correct error messages', async () => {
      const text = findField(volumeForm, 'volume')
      expect(text.options.errors['number.base'].message).to.equal('Enter the volume in ML (megalitres).')
      expect(text.options.errors['number.custom'].message).to.equal('Enter a number with no more than 6 decimal places. For example, 20.123456')
    })

    test('sets the value of the volume, if provided', async () => {
      volumeForm = form(createRequest([{
        id: 'test-element-id',
        volume: 234
      }]))
      const volumeField = findField(volumeForm, 'volume')
      expect(volumeField.value).to.equal(234)
    })
  })

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          volume: '1'
        }, { allowUnknown: true })
        expect(result.error).to.be.undefined()
      })

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'scissors',
          volume: '1'
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })
    })

    experiment('volume', () => {
      test('validates for a number string', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          volume: '123'
        }, { allowUnknown: true })
        expect(result.error).to.not.exist()
      })

      test('validates for a number string with 6 decimal places', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          volume: '132.123456'
        }, { allowUnknown: true })
        expect(result.error).to.not.exist()
      })

      test('must not have more than 6 decimal places', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          volume: '132.1234567'
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })

      test('must be greater than 0', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          volume: '0'
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })

      test('must be a number', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          volume: 'asdasdasd'
        }, { allowUnknown: true })

        expect(result.error).to.exist()
      })

      test('can not be empty', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          volume: ''
        }, { allowUnknown: true })
        expect(result.error).to.exist()
      })
    })
  })
})
