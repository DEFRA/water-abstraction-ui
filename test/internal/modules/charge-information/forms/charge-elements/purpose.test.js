'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/purpose')
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
    defaultCharges: [
      { purposeUse: { id: 'test-id', name: 'test-purpose-name' } },
      { purposeUse: { id: 'test-id', name: 'test-purpose-name' } }
    ],
    draftChargeInformation: {
      chargeElements: chargeElements || []
    }
  }
})

experiment('internal/modules/charge-information/forms/charge-element/purpose', () => {
  let purposeForm

  beforeEach(async () => {
    purposeForm = form(createRequest())
  })

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(purposeForm.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const csrf = findField(purposeForm, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('has a submit button', async () => {
      const button = findButton(purposeForm)
      expect(button.options.label).to.equal('Continue')
    })

    test('has a unique set of choices from the defaultCharge data', async () => {
      const radio = findField(purposeForm, 'purpose')

      expect(radio.options.choices[0].label).to.equal('test-purpose-name')
      expect(radio.options.choices.length).to.equal(1)
    })

    test('sets the value of the purpose field, if provided', async () => {
      purposeForm = form(createRequest([{
        id: 'test-element-id',
        purposeUse: {
          id: 'test-purpose-use-id',
          loss: 'low'
        }
      }]))
      const purpose = findField(purposeForm, 'purpose')
      expect(purpose.value).to.equal('test-purpose-use-id')
    })
  })

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', purpose: 'c5afe238-fb77-4131-be80-384aaf245842' })
        expect(result.error).to.be.undefined()
      })

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({ csrf_token: 'sciccors', purpose: 'c5afe238-fb77-4131-be80-384aaf245842' })
        expect(result.error).to.exist()
      })
    })

    experiment('purpose', () => {
      test('validates for a uuid', async () => {
        const result = schema().validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', purpose: 'c5afe238-fb77-4131-be80-384aaf245842' })
        expect(result.error).to.not.exist()
      })

      test('can not be a nomral string', async () => {
        const result = schema().validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', purpose: '🔥' })
        expect(result.error).to.exist()
      })
    })
  })
})
