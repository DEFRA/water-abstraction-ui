'use strict'

const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { set } = require('lodash')
const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const controller = require('external/modules/company-selector/controller')
const loginHelpers = require('external/lib/login-helpers')
const { externalUserWithLicences } = require('../../../shared/responses/water-service/user/_userId_/status')

const userId = 'user_1'

experiment('modules/company-selector/controller', () => {
  let request, h

  const userData = externalUserWithLicences().data

  const createRequest = () => ({
    view: {
      csrfToken: '2abbe559-7e06-4dcc-8856-451b737ecbf0'
    },
    auth: {
      credentials: {
        userId,
        scope: ['external']
      }
    },
    defra: {
      userId
    },
    payload: {
      csrf_token: '2abbe559-7e06-4dcc-8856-451b737ecbf0'
    }
  })

  beforeEach(async () => {
    request = createRequest()
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    }
    sandbox.stub(loginHelpers, 'loadUserData').resolves(userData)
    sandbox.stub(loginHelpers, 'getUserID').returns(userId)
    sandbox.stub(loginHelpers, 'selectCompany')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('getSelectCompany', () => {
    beforeEach(async () => {
      await controller.getSelectCompany(request, h)
    })

    test('loads user details using the user ID', async () => {
      const [id] = loginHelpers.loadUserData.lastCall.args
      expect(id).to.equal(userId)
    })

    test('uses the correct nunjucks template', async () => {
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/auth/select-company')
    })

    test('sets the page title in the view', async () => {
      const [, { pageTitle }] = h.view.lastCall.args
      expect(pageTitle).to.equal('Choose a licence holder')
    })

    test('does not show the back link if there is no company selected', async () => {
      const [, { back }] = h.view.lastCall.args
      expect(back).to.be.false()
    })

    test('shows the back link if there is a company selected', async () => {
      const request = createRequest()
      request.defra.companyId = 'test-company-id'
      await controller.getSelectCompany(request, h)
      const [, { back }] = h.view.lastCall.args
      expect(back).to.equal('/licences')
    })

    test('sets a form object in the view', async () => {
      const [, { form }] = h.view.lastCall.args
      expect(form).to.be.an.object()
      expect(form.action).to.equal('/select-company')
    })
  })

  experiment('postSelectCompany', () => {
    beforeEach(async () => {
      await controller.postSelectCompany(request, h)
    })

    test('loads user details using the user ID', async () => {
      const [id] = loginHelpers.loadUserData.lastCall.args
      expect(id).to.equal(userId)
    })

    experiment('when form payload is invalid', () => {
      test('the form is displayed again', async () => {
        const [template] = h.view.lastCall.args
        expect(template).to.equal('nunjucks/auth/select-company')
      })

      test('the form has errors', async () => {
        const [, { form: { errors } }] = h.view.lastCall.args
        expect(errors.length).to.equal(1)
        expect(errors[0].name).to.equal('company')
      })
    })

    experiment('when form payload is valid', () => {
      beforeEach(async () => {
        set(request, 'payload.company', 0)
        await controller.postSelectCompany(request, h)
      })

      test('sets the company ID', async () => {
        const { args } = loginHelpers.selectCompany.lastCall
        expect(args[0]).to.equal(request)
        expect(args[1]).to.equal(userData.companies[0])
      })

      test('redirects user', async () => {
        const [path] = h.redirect.lastCall.args
        expect(path).to.equal('/licences')
      })
    })
  })
})
