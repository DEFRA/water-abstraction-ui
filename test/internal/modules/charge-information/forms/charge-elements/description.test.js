'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/description')
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

const sessionData = {}

experiment('internal/modules/charge-information/forms/charge-element/description', () => {
  let descriptionForm

  beforeEach(async () => {
    descriptionForm = form(createRequest(), sessionData)
  })

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(descriptionForm.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const csrf = findField(descriptionForm, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('has a submit button', async () => {
      const button = findButton(descriptionForm)
      expect(button.options.label).to.equal('Continue')
    })

    test('has a description text field with the expected hint', async () => {
      const text = findField(descriptionForm, 'description')
      expect(text.options.label).to.equal('')
      expect(text.options.hint).to.equal('For example, describe where the abstraction point is')
    })

    test('sets the value of the description, if provided', async () => {
      descriptionForm = form(createRequest([{
        id: 'test-element-id',
        description: 'test-description'
      }]))
      const text = findField(descriptionForm, 'description')
      expect(text.value).to.equal('test-description')
    })
  })

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: 'Port-salut fondue squirty cheese. Monterey jack feta cheese strings boursin cow ricotta halloumi cheese and biscuits. The big cheese cheese strings emmental bocconcini hard cheese st. agur blue cheese the big cheese fromage. Cut the cheese danish fontina camembert de normandie.'
        })
        expect(result.error).to.be.undefined()
      })

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'Brie',
          description: 'Port-salut fondue squirty cheese. Monterey jack feta cheese strings boursin cow ricotta halloumi cheese and biscuits. The big cheese cheese strings emmental bocconcini hard cheese st. agur blue cheese the big cheese fromage. Cut the cheese danish fontina camembert de normandie.'
        })
        expect(result.error).to.exist()
      })
    })

    experiment('description', () => {
      test('validates for a string', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: 'Port-salut fondue squirty cheese. Monterey jack feta cheese strings boursin cow ricotta halloumi cheese and biscuits. The big cheese cheese strings emmental bocconcini hard cheese st. agur blue cheese the big cheese fromage. Cut the cheese danish fontina camembert de normandie.'
        })
        expect(result.error).to.not.exist()
      })

      test('can not null or empty', async () => {
        const experiment1 = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: ''
        })
        expect(experiment1.error).to.exist()

        const experiment2 = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          description: null
        })
        expect(experiment2.error).to.exist()
      })
    })
  })
})
