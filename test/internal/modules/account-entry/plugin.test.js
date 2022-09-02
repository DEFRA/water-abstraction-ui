'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()

const plugin = require('internal/modules/account-entry/plugin')
const session = require('internal/modules/account-entry/lib/session')

const createOptions = () => ({
  back: '/back/path',
  redirectPath: '/redirect/path',
  caption: 'Caption',
  searchQuery: 'Big farm',
  key: 'a-unique-key',
  data: {}
})

experiment('internal/modules/account-entry/plugin', () => {
  let server

  beforeEach(async () => {
    sandbox.stub(session, 'set')
    sandbox.stub(session, 'get')
    server = {
      decorate: sandbox.stub(),
      route: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('has a package name and version', async () => {
    expect(plugin.pkg.name).to.equal('accountEntryPlugin')
    expect(plugin.pkg.version).to.equal('2.0.0')
  })

  test('has a register method', async () => {
    expect(plugin.register).to.be.a.function()
  })

  experiment('the plugin .register method', () => {
    beforeEach(async () => {
      await plugin.register(server)
    })

    test('the hapi request is decorated with the accountEntryRedirect method', async () => {
      expect(server.decorate.calledWith(
        'request', 'accountEntryRedirect', plugin._accountEntryRedirect
      )).to.be.true()
    })

    test('the hapi request is decorated with the getAccountEntry method', async () => {
      expect(server.decorate.calledWith(
        'request', 'getAccountEntry', plugin._getAccountEntry
      )).to.be.true()
    })
  })

  experiment('.accountEntryRedirect request method', () => {
    let options

    beforeEach(async () => {
      options = createOptions()
    })

    test('throws an error if the "back" option is omitted', async () => {
      delete options.back
      const func = () => plugin._accountEntryRedirect(options)
      expect(func).to.throw()
    })

    test('throws an error if the "redirectPath" option is omitted', async () => {
      delete options.redirectPath
      const func = () => plugin._accountEntryRedirect(options)
      expect(func).to.throw()
    })

    test('"caption" option is optional', async () => {
      delete options.caption
      const func = () => plugin._accountEntryRedirect(options)
      expect(func).to.not.throw()
    })

    test('throws an error if the "searchQuery" option is omitted', async () => {
      delete options.redirectPath
      const func = () => plugin._accountEntryRedirect(options)
      expect(func).to.throw()
    })

    test('throws an error if the "key" option is omitted', async () => {
      delete options.key
      const func = () => plugin._accountEntryRedirect(options)
      expect(func).to.throw()
    })

    test('"data" option is optional', async () => {
      delete options.data
      const func = () => plugin._accountEntryRedirect(options)
      expect(func).to.not.throw()
    })

    test('saves the supplied options to the session', async () => {
      const request = {}
      plugin._accountEntryRedirect.call(request, options)
      expect(session.set.calledWith(
        request, options.key, options
      )).to.be.true()
    })

    test('returns a redirect path', async () => {
      const request = {}
      const path = plugin._accountEntryRedirect.call(request, options)
      expect(path).to.equal(`/account-entry/${options.key}/select-existing-account?q=${encodeURIComponent(options.searchQuery)}`)
    })
  })

  experiment('.accountEntryRedirect request method', () => {
    let result, request
    const KEY = 'test-key'

    beforeEach(async () => {
      session.get.returns({
        data: {
          foo: 'bar'
        }
      })
      request = {}
      result = plugin._getAccountEntry.call(request, KEY)
    })

    test('calls session.get with the request and key', async () => {
      expect(session.get.calledWith(request, KEY)).to.be.true()
    })

    test('returns the .data object in the session', async () => {
      expect(result).to.equal({
        foo: 'bar'
      })
    })
  })
})
