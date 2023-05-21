const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const plugin = require('shared/plugins/cookie-message')
const constants = require('shared/plugins/cookie-message/lib/constants')

experiment('plugins/cookie-message/index', () => {
  let server, request, h

  beforeEach(() => {
    server = {
      state: sandbox.stub(),
      ext: sandbox.stub(),
      decorate: sandbox.stub(),
      route: sandbox.stub()
    }

    h = {
      state: sandbox.stub(),
      unstate: sandbox.stub(),
      continue: 'continue',
      request: {
        info: {
          hostname: 'subdomain.defra.cloud'
        }
      }
    }

    request = {
      path: '/test/path',
      query: {
        foo: 'bar'
      },
      yar: {
        flash: sandbox.stub()
      },
      isAnalyticsCookiesEnabled: sandbox.stub(),
      state: {}
    }

    sandbox.stub(process, 'env').value({ ENVIRONMENT: 'dev' })
  })
  afterEach(() => {
    sandbox.restore()
  })

  test('includes package name and version', () => {
    expect(plugin.pkg).to.equal({
      name: 'cookieMessagePlugin',
      version: '2.0.0',
      dependencies: {
        yar: '9.x.x'
      }
    })
  })

  test('has a register function', () => {
    expect(plugin.register).to.be.a.function()
  })

  experiment('the register function', () => {
    beforeEach(async () => {
      plugin.register(server)
    })

    test('defines the state cookie', () => {
      expect(server.state.calledWith(
        'accept_analytics_cookies',
        {
          isSecure: true,
          isHttpOnly: true,
          ttl: 365 * 24 * 60 * 60 * 1000,
          isSameSite: 'Lax'
        }
      )).to.be.true()
    })

    test('registers the pre handler', () => {
      expect(server.ext.calledWith({
        type: 'onPreHandler',
        method: plugin._handler
      })).to.be.true()
    })

    test('decorates request with isAnalyticsCookiesEnabled method', () => {
      expect(server.decorate.calledWith(
        'request', 'isAnalyticsCookiesEnabled', plugin._isAnalyticsCookiesEnabled
      )).to.be.true()
    })

    test('decorates response toolkit with setCookiePreferences method', () => {
      expect(server.decorate.calledWith(
        'toolkit', 'setCookiePreferences', plugin._setCookiePreferences
      )).to.be.true()
    })
  })

  experiment('the pre-handler', () => {
    experiment('when analytics cookies are not accepted/rejected', () => {
      beforeEach(async () => {
        request.yar.flash.returns([])
        request.isAnalyticsCookiesEnabled.returns(null)
        await plugin._handler(request, h)
      })

      test('state is set in the view', () => {
        expect(request.view.cookieBanner).to.equal({
          isAnalyticsCookiesEnabled: null,
          isVisible: true,
          acceptPath: '/set-cookie-preferences?redirectPath=%2Ftest%2Fpath%3Ffoo%3Dbar&acceptAnalytics=true',
          rejectPath: '/set-cookie-preferences?redirectPath=%2Ftest%2Fpath%3Ffoo%3Dbar&acceptAnalytics=false',
          flashMessage: undefined,
          cookiesPagePath: '/cookies?redirectPath=%2Ftest%2Fpath%3Ffoo%3Dbar'
        })
      })
    })

    experiment('when analytics cookies are not accepted/rejected and the user is on the cookies page', () => {
      beforeEach(async () => {
        request.path = '/cookies'
        request.yar.flash.returns([])
        request.isAnalyticsCookiesEnabled.returns(null)
        await plugin._handler(request, h)
      })

      test('the cookie banner is hidden', () => {
        expect(request.view.cookieBanner.isVisible).to.be.false()
      })
    })

    experiment('when analytics cookies are accepted', () => {
      beforeEach(async () => {
        request.yar.flash.returns([])
        request.isAnalyticsCookiesEnabled.returns(true)
        await plugin._handler(request, h)
      })

      test('the cookie banner is hidden', () => {
        expect(request.view.cookieBanner.isVisible).to.be.false()
      })

      test('the flag is set to enable the cookies', () => {
        expect(request.view.cookieBanner.isAnalyticsCookiesEnabled).to.be.true()
      })
    })

    experiment('when analytics cookies are rejected', () => {
      beforeEach(async () => {
        request.yar.flash.returns([])
        request.isAnalyticsCookiesEnabled.returns(false)
        await plugin._handler(request, h)
      })

      test('the cookie banner is hidden', () => {
        expect(request.view.cookieBanner.isVisible).to.be.false()
      })

      test('the flag is cleared to disable the cookies', () => {
        expect(request.view.cookieBanner.isAnalyticsCookiesEnabled).to.be.false()
      })
    })

    experiment('when a flash message is displayed', () => {
      const flashMessage = 'You rejected cookies'

      beforeEach(async () => {
        request.yar.flash.returns([flashMessage])
        request.isAnalyticsCookiesEnabled.returns(false)
        await plugin._handler(request, h)
      })

      test('the flash message is set in the view', () => {
        expect(request.view.cookieBanner.flashMessage).to.equal(flashMessage)
      })
    })
  })

  experiment('the isAnalyticsCookiesEnabled request method', () => {
    test('returns null when the cookie is not set', () => {
      request.state = {}
      expect(plugin._isAnalyticsCookiesEnabled.call(request)).to.be.null()
    })

    test('returns true when the cookie is accepted', () => {
      request.state = {
        [constants.cookieName]: constants.accepted
      }
      expect(plugin._isAnalyticsCookiesEnabled.call(request)).to.be.true()
    })

    test('returns false when the cookie is rejected', () => {
      request.state = {
        [constants.cookieName]: constants.rejected
      }
      expect(plugin._isAnalyticsCookiesEnabled.call(request)).to.be.false()
    })
  })

  experiment('the setCookiePreferences toolkit method', () => {
    experiment('when cookies are accepted', () => {
      beforeEach(() => {
        plugin._setCookiePreferences.call(h, true)
      })

      test('sets the preferences cookie', () => {
        expect(h.state.calledWith(constants.cookieName, constants.accepted)).to.be.true()
      })

      test('does not unset any cookies', () => {
        expect(h.unstate.called).to.be.false()
      })
    })

    experiment('when cookies are rejected', () => {
      beforeEach(() => {
        plugin._setCookiePreferences.call(h, false)
      })

      test('sets the preferences cookie', () => {
        expect(h.state.calledWith(constants.cookieName, constants.rejected)).to.be.true()
      })

      test('unset any analytics cookies', () => {
        expect(h.unstate.calledWith('_ga', { domain: '.defra.cloud' })).to.be.true()
        expect(h.unstate.calledWith('_gid', { domain: '.defra.cloud' })).to.be.true()
        expect(h.unstate.calledWith('_gat', { domain: '.defra.cloud' })).to.be.true()
        expect(h.unstate.calledWith('_gat_govuk_shared', { domain: '.defra.cloud' })).to.be.true()
      })
    })
  })
})
