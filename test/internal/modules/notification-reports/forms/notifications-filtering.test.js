'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  afterEach,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')
const { omit } = require('lodash')

const notificationsFiltering = require('internal/modules/notifications-reports/forms/notifications-filtering')
const { findField } = require('../../../../lib/form-test')

const ID = 'test-id'

const notificationCategories = [{
  categoryValue: 'cat 1',
  categoryLabel: 'Cat 1'
}, {
  categoryValue: 'cat 2',
  categoryLabel: 'Cat 2'
}]

const createRequest = (query = {}) => ({
  view: {
    csrfToken: 'token'
  },
  query,
  params: {
    id: ID
  },
  pre: { notificationCategories },
  yar: {
    get: sandbox.stub()
  }
})

experiment('internal/modules/notifications-reports/forms/notifications-filtering', () => {
  afterEach(() => sandbox.restore())

  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const form = notificationsFiltering.form(createRequest())
      expect(form.method).to.equal('POST')
    })

    test('has CSRF token field', async () => {
      const form = notificationsFiltering.form(createRequest())
      const csrf = findField(form, 'csrf_token')
      expect(csrf.value).to.equal('token')
    })

    test('includes all of the categories', async () => {
      const form = notificationsFiltering.form(createRequest())
      const { options } = findField(form, 'categories')
      const [cat1, cat2] = notificationCategories
      expect(options.choices[0].label).to.equal(cat1.categoryLabel)
      expect(options.choices[0].value).to.equal(cat1.categoryValue)
      expect(options.choices[1].label).to.equal(cat2.categoryLabel)
      expect(options.choices[1].value).to.equal(cat2.categoryValue)
    })
  })

  experiment('.schema', () => {
    let data, request

    beforeEach(async () => {
      data = {
        csrf_token: uuid(),
        categories: [],
        sender: ''
      }
      request = {
        pre: {
          notificationCategories: [{
            uprn: 123
          }, {
            uprn: 456
          }]
        }
      }
    })

    test('validates when the data is valid', async () => {
      const { error } = notificationsFiltering.schema(request).validate(data)
      expect(error).to.be.undefined()
    })

    experiment('.csrf_token validation', () => {
      test('fails if omitted', async () => {
        const { error } = notificationsFiltering.schema(request).validate(omit(data, 'csrf_token'))
        expect(error).to.not.be.null()
      })

      test('fails if not a guid', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          csrf_token: 'not-a-guid'
        })
        expect(error).to.not.be.null()
      })
    })

    experiment('.uprn validation', () => {
      test('fails if omitted', async () => {
        const { error } = notificationsFiltering.schema(request).validate(omit(data, 'uprn'))
        expect(error).to.not.be.null()
      })

      test('fails if not a number', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          uprn: null
        })
        expect(error).to.not.be.undefined()
      })

      test('fails if not one of the address search results defined in request.pre', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          uprn: 999
        })
        expect(error).to.not.be.undefined()
      })
    })

    experiment('.categories validation', () => {
      test('passes if omitted', async () => {
        const { error } = notificationsFiltering.schema(request).validate(omit(data, 'categories'))
        expect(error).to.be.undefined()
      })

      test('fails if not an array', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          categories: null
        })
        expect(error).to.not.be.undefined()
        expect(error.message).to.equal('"categories" must be an array')
      })

      test('passes if a valid array', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          categories: []
        })
        expect(error).to.be.undefined()
      })
    })

    experiment('.sender validation', () => {
      test('passes if omitted', async () => {
        const { error } = notificationsFiltering.schema(request).validate(omit(data, 'sender'))
        expect(error).to.be.undefined()
      })

      test('fails if not a string', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          sender: null
        })
        expect(error).to.not.be.undefined()
        expect(error.message).to.equal('"sender" must be a string')
      })

      test('passes if an empty string', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          sender: ''
        })
        expect(error).to.be.undefined()
      })

      test('fails if not a valid email address', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          sender: 'invalid email address'
        })
        expect(error).to.not.be.undefined()
        expect(error.message).to.equal('"sender" must be a valid email')
      })

      test('passes if a valid email address', async () => {
        const { error } = notificationsFiltering.schema(request).validate({
          ...data,
          sender: 'test@test.com'
        })
        expect(error).to.be.undefined()
      })
    })
  })
})
