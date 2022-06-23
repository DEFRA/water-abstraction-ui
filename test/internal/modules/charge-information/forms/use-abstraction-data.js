'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { get } = require('lodash')

const { form, schema } = require('internal/modules/charge-information/forms/use-abstraction-data')
const { findField, findButton } = require('../../../../lib/form-test')

let chargeVersions
let draftScheme

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  pre: {
    licence: {
      id: 'test-licence-id'
    },
    draftChargeInformation: { scheme: draftScheme },
    chargeVersions
  }
})

experiment('internal/modules/charge-information/forms/use-abstraction-data', () => {
  beforeEach(() => {
    draftScheme = 'sroc'
    chargeVersions = [
      { id: 'test-cv-id-1', status: 'superseded', scheme: 'alcs', dateRange: { startDate: '2001-03-19' } },
      { id: 'test-cv-id-4', status: 'current', scheme: 'sroc', dateRange: { startDate: '2022-06-19' } },
      { id: 'test-cv-id-2', status: 'invalid', scheme: 'alcs', dateRange: { startDate: '2015-06-19' } },
      { id: 'test-cv-id-3', status: 'current', scheme: 'alcs', dateRange: { startDate: '2015-06-19' } }
    ]
  })

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const abstractionForm = form(createRequest())
      expect(abstractionForm.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const abstractionForm = form(createRequest())
      const csrf = findField(abstractionForm, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('has a submit button', async () => {
      const abstractionForm = form(createRequest())
      const button = findButton(abstractionForm)
      expect(button.options.label).to.equal('Continue')
    })

    test('has yes and no choices for using abstraction data and does not include the divider', async () => {
      chargeVersions = []
      const abstractionForm = form(createRequest())
      const radio = findField(abstractionForm, 'useAbstractionData')

      expect(radio.options.choices).to.equal([
        {
          label: 'Yes',
          value: 'yes'
        },
        {
          label: 'No',
          value: 'no'
        }
      ]
      )
    })

    test('has yes and no choices as well as all options for existing charge versions for using abstraction data when draft scheme is sroc', async () => {
      draftScheme = 'sroc'
      const request = createRequest()
      const abstractionForm = form(request)
      const radio = findField(abstractionForm, 'useAbstractionData')

      expect(radio.options.choices).to.equal([
        {
          label: 'Yes',
          value: 'yes'
        },
        {
          label: 'No',
          value: 'no'
        },
        {
          divider: 'or'
        },
        {
          label: 'Use charge information valid from 19 June 2022',
          value: 'test-cv-id-4'
        },
        {
          label: 'Use charge information valid from 19 June 2015',
          value: 'test-cv-id-3'
        }
      ]
      )
    })

    test('has yes and no choices as well as only options for existing alcs charge versions for using abstraction data when draft scheme is alcs', async () => {
      draftScheme = 'alcs'
      const request = createRequest()
      const abstractionForm = form(request)
      const radio = findField(abstractionForm, 'useAbstractionData')

      expect(radio.options.choices).to.equal([
        {
          label: 'Yes',
          value: 'yes'
        },
        {
          label: 'No',
          value: 'no'
        },
        {
          divider: 'or'
        },
        {
          label: 'Use charge information valid from 19 June 2015',
          value: 'test-cv-id-3'
        }
      ]
      )
    })
  })

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'yes'
        })
        expect(result.error).to.not.exist()
      })

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'pizza',
          useAbstractionData: 'yes'
        })
        expect(get(result, 'error.message')).to.equal('"csrf_token" must be a valid GUID')
      })
    })

    experiment('useAbstractionData', () => {
      test('can be true', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'yes'
        })
        expect(result.error).to.not.exist()
      })

      test('can be no', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'no'
        })
        expect(result.error).to.not.exist()
      })

      test('can be a charge version id for an sroc charge version if the draft scheme is sroc', async () => {
        draftScheme = 'sroc'
        const request = createRequest()
        const result = schema(request).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'test-cv-id-4'
        })
        expect(result.error).to.not.exist()
      })

      test('cannot be a charge version id for an sroc charge version if the draft scheme is alcs', async () => {
        draftScheme = 'alcs'
        const request = createRequest()
        const result = schema(request).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'test-cv-id-4'
        })
        expect(get(result, 'error.message')).to.equal('"useAbstractionData" must be one of [yes, no, test-cv-id-3]')
      })

      test('can be a charge version id for an alcs charge version if the draft scheme is sroc', async () => {
        draftScheme = 'sroc'
        const request = createRequest()
        const result = schema(request).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'test-cv-id-3'
        })
        expect(result.error).to.not.exist()
      })

      test('can be a charge version id for an alcs charge version if the draft scheme is alcs', async () => {
        draftScheme = 'alcs'
        const request = createRequest()
        const result = schema(request).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'test-cv-id-3'
        })
        expect(result.error).to.not.exist()
      })

      test('cannot be a unexpected string', async () => {
        const request = createRequest()
        const result = schema(request).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          useAbstractionData: 'test-cv-id-5'
        })
        expect(get(result, 'error.message')).to.equal('"useAbstractionData" must be one of [yes, no, test-cv-id-4, test-cv-id-3]')
      })
    })
  })
})
