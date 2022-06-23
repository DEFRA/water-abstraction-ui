'use strict'

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/abstraction-period')
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

experiment('internal/modules/charge-information/forms/charge-element/abstraction-period', () => {
  let abstractionPeriodForm

  beforeEach(async () => {
    abstractionPeriodForm = form(createRequest())
  })

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      expect(abstractionPeriodForm.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const csrf = findField(abstractionPeriodForm, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('has a submit button', async () => {
      const button = findButton(abstractionPeriodForm)
      expect(button.options.label).to.equal('Continue')
    })

    test('has a startDate field', async () => {
      const dateField = findField(abstractionPeriodForm, 'startDate')
      expect(dateField.options.label).to.equal('Start date')
      expect(dateField.options.widget).to.equal('date')
      expect(dateField.options.mapper).to.equal('dayOfYearMapper')
    })

    test('has a endDate field', async () => {
      const dateField = findField(abstractionPeriodForm, 'endDate')
      expect(dateField.options.label).to.equal('End date')
      expect(dateField.options.widget).to.equal('date')
      expect(dateField.options.mapper).to.equal('dayOfYearMapper')
    })

    test('populates the date fields if data is available', async () => {
      abstractionPeriodForm = form(createRequest([{
        id: 'test-element-id',
        abstractionPeriod: {
          startDay: 1,
          startMonth: 4,
          endDay: 31,
          endMonth: 10
        }
      }]))
      const startDateField = findField(abstractionPeriodForm, 'startDate')
      const endDateField = findField(abstractionPeriodForm, 'endDate')
      expect(startDateField.value).to.equal('4-1')
      expect(endDateField.value).to.equal('10-31')
    })
  })

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          startDate: '2001-01-01',
          endDate: '2011-01-01'
        })
        expect(result.error).to.be.undefined()
      })

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).validate({
          csrf_token: 'burgers',
          startDate: '2001-01-01',
          endDate: '2011-01-01'
        })
        expect(result.error).to.exist()
      })
    })

    experiment('startDate', () => {
      test('validates for a string', async () => {
        // we test for year month day even though there is only a day and month text box
        // the day of year mapper adds a year when validating using the form widgets
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          startDate: '2001-01-01',
          endDate: '2011-01-01'
        })
        expect(result.error).to.not.exist()
      })

      test('can not null or empty', async () => {
        const experiment1 = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          startDate: '',
          endDate: '2011-01-01'
        })
        expect(experiment1.error).to.exist()

        const experiment2 = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          startDate: null,
          endDate: '2011-01-01'
        })
        expect(experiment2.error).to.exist()
      })
    })
    experiment('endDate', () => {
      test('validates for a string', async () => {
        // we test for year momth day even though there is only a day and month text box
        // the day of year mapper adds a year when validating using the form widgets
        const result = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          startDate: '2001-01-01',
          endDate: '2011-01-01'
        })
        expect(result.error).to.not.exist()
      })

      test('can not null or empty', async () => {
        const experiment1 = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          startDate: '2001-01-01',
          endDate: null
        })
        expect(experiment1.error).to.exist()

        const experiment2 = schema(createRequest()).validate({
          csrf_token: 'c5afe238-fb77-4131-be80-384aaf245842',
          startDate: '2001-01-01',
          endDate: ''
        })
        expect(experiment2.error).to.exist()
      })
    })
  })
})
