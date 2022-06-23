'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { LOSS_CATEGORIES } = require('../../../../../../src/internal/modules/charge-information/lib/charge-elements/constants')
const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/loss-category')
const { findField, findButton } = require('../../../../../lib/form-test')
const { capitalize } = require('lodash')
const createRequest = chargeElementData => ({
  view: {
    csrfToken: 'token'
  },
  query: {
    categoryId: ''
  },
  pre: {
    defaultCharges: [{ purposeUse: { id: 'test-purpose-use-id', loss: 'low' }, loss: 'low' }],
    draftChargeInformation: {
      chargeElements: [{
        id: 'test-element-id',
        purposeUse: {
          id: 'test-purpose-use-id',
          lossFactor: 'low'
        },
        ...chargeElementData
      }]
    }
  },
  params: {
    elementId: 'test-element-id'
  }
})

experiment('internal/modules/charge-information/forms/charge-element/loss-category', () => {
  let lossCategoryForm

  beforeEach(async () => {
    lossCategoryForm = form(createRequest())
  })

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(lossCategoryForm.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const csrf = findField(lossCategoryForm, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('has a submit button', async () => {
      const button = findButton(lossCategoryForm)
      expect(button.options.label).to.equal('Continue')
    })

    test('has a 4 choices high, medium, low, very low and low has the hint', async () => {
      const radio = findField(lossCategoryForm, 'loss')
      const lossCategoryValues = Object.values(radio.options.choices).map(choice => choice.value)
      const lossCategoryLabels = Object.values(radio.options.choices).map(choice => choice.label)
      expect(lossCategoryValues).to.equal(LOSS_CATEGORIES)
      expect(lossCategoryLabels).to.equal(LOSS_CATEGORIES.map(category => capitalize(category)))
      expect(radio.options.choices[2].hint).to.equal('This is the default loss category for the purpose chosen')
    })

    test('sets the value of the loss field, if provided', async () => {
      lossCategoryForm = form(createRequest({ loss: 'medium' }))
      const loss = findField(lossCategoryForm, 'loss')
      expect(loss.value).to.equal('medium')
    })
  })

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', loss: LOSS_CATEGORIES[0] })
        expect(result.error).to.be.undefined()
      })

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({ csrf_token: 'sciccors', loss: LOSS_CATEGORIES[0] })
        expect(result.error).to.exist()
      })
    })

    experiment('loss', () => {
      LOSS_CATEGORIES.forEach(option => {
        test('validates for a string', async () => {
          const result = schema().validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', loss: option })
          expect(result.error).to.not.exist()
        })
      })

      test('can not be any other string', async () => {
        const result = schema().validate({ csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842', loss: 'test' })
        expect(result.error).to.exist()
      })
    })
  })
})
