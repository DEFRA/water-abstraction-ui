const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const controller = require('shared/plugins/cookie-message/controller')
const constants = require('shared/plugins/cookie-message/lib/constants')

const { findField } = require('../../../lib/form-test')

experiment('plugins/cookie-message/controller', () => {
  let request, h

  const redirectPath = '/original/page'

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      setCookiePreferences: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    }
    request = {
      query: {
        redirectPath
      },
      method: 'get',
      isAnalyticsCookiesEnabled: sandbox.stub(),
      yar: {
        get: sandbox.stub(),
        set: sandbox.stub(),
        flash: sandbox.stub()
      },
      view: {},
      auth: {}
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getCookies', () => {
    beforeEach(async () => {
      request.path = '/cookies'
      await controller.getCookies(request, h)
    })

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/content/cookies')
    })

    test('hides the notification banner', async () => {
      const [, { isNotificationBannerVisible }] = h.view.lastCall.args
      expect(isNotificationBannerVisible).to.be.false()
    })

    experiment('defines a form', () => {
      let form

      beforeEach(async () => {
        form = h.view.lastCall.args[1].form
      })

      test('with the correct method and action', async () => {
        expect(form.method).to.equal('POST')
        expect(form.action).to.equal(request.path)
      })

      test('with a radio field', async () => {
        const radioField = findField(form, 'acceptAnalyticsCookies')
        expect(radioField.options.label).to.equal('Do you want to accept analytics cookies?')
        expect(radioField.value).to.equal(false)
      })

      test('the radio field has a "Yes" option', async () => {
        const radioField = findField(form, 'acceptAnalyticsCookies')
        expect(radioField.options.choices[0].label).to.equal('Yes')
        expect(radioField.options.choices[0].value).to.equal(true)
      })

      test('the radio field has a "No" option', async () => {
        const radioField = findField(form, 'acceptAnalyticsCookies')
        expect(radioField.options.choices[1].label).to.equal('No')
        expect(radioField.options.choices[1].value).to.equal(false)
      })

      test('with a hidden field containing the redirect path', async () => {
        const hiddenField = findField(form, 'redirectPath')
        expect(hiddenField.value).to.equal(request.query.redirectPath)
      })

      test('with a submit button', async () => {
        const button = form.fields.find(field => field.options.widget === 'button')
        expect(button.options.label).to.equal('Save cookie settings')
      })
    })
  })

  experiment('.postCookies', () => {
    experiment('when cookies are accepted', () => {
      beforeEach(async () => {
        request.method = 'post'
        request.payload = {
          acceptAnalyticsCookies: 'true',
          redirectPath
        }
        await controller.postCookies(request, h)
      })

      test('accepts analytics cookies', async () => {
        expect(h.setCookiePreferences.calledWith(true)).to.be.true()
      })

      test('redirects to the form page', async () => {
        expect(h.postRedirectGet.called).to.be.true()
      })
    })

    experiment('when cookies are rejected', () => {
      beforeEach(async () => {
        request.method = 'post'
        request.payload = {
          acceptAnalyticsCookies: 'false',
          redirectPath
        }
        await controller.postCookies(request, h)
      })

      test('accepts analytics cookies', async () => {
        expect(h.setCookiePreferences.calledWith(false)).to.be.true()
      })

      test('redirects to the form page', async () => {
        expect(h.postRedirectGet.called).to.be.true()
      })
    })

    experiment('when the payload is invalid', () => {
      beforeEach(async () => {
        request.method = 'post'
        request.payload = {
          acceptAnalyticsCookies: 'blah',
          redirectPath
        }
        await controller.postCookies(request, h)
      })

      test('does not call h.setCookiePreferences', async () => {
        expect(h.setCookiePreferences.called).to.be.false()
      })

      test('redirects to the form page', async () => {
        expect(h.postRedirectGet.called).to.be.true()
      })
    })
  })

  experiment('.getSetCookiePreferences', () => {
    experiment('when cookies are accepted', () => {
      beforeEach(async () => {
        request.query = {
          redirectPath,
          acceptAnalytics: true
        }
        await controller.getSetCookiePreferences(request, h)
      })

      test('sets the cookie preferences', async () => {
        expect(h.setCookiePreferences.calledWith(true)).to.be.true()
      })

      test('sets the flash message', async () => {
        expect(request.yar.flash.calledWith(
          constants.flashMessageType, 'You’ve accepted analytics cookies.'
        )).to.be.true()
      })

      test('redirects to the redirectPath', async () => {
        expect(h.redirect.calledWith(redirectPath))
      })
    })

    experiment('when cookies are rejected', () => {
      beforeEach(async () => {
        request.query = {
          redirectPath,
          acceptAnalytics: false
        }
        await controller.getSetCookiePreferences(request, h)
      })

      test('sets the cookie preferences', async () => {
        expect(h.setCookiePreferences.calledWith(false)).to.be.true()
      })

      test('sets the flash message', async () => {
        expect(request.yar.flash.calledWith(
          constants.flashMessageType, 'You’ve rejected analytics cookies.'
        )).to.be.true()
      })

      test('redirects to the redirectPath', async () => {
        expect(h.redirect.calledWith(redirectPath))
      })
    })
  })
})
