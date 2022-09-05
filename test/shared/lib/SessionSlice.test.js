'use strict'

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const SessionSlice = require('shared/lib/SessionSlice')

const sandbox = require('sinon').createSandbox()

const createRequest = (overrides = {}) => ({
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub(),
    clear: sandbox.stub()
  },
  ...overrides
})

const KEY = 'test-key'
const KEY_PREFIX = 'test-key-prefix'

experiment('shared/lib/SessionSlice', () => {
  let slice, request

  beforeEach(async () => {
    slice = new SessionSlice(KEY_PREFIX)
    request = createRequest()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('.get gets the value from the yar', async () => {
    slice.get(request, KEY)
    expect(request.yar.get.calledWith(`${KEY_PREFIX}.${KEY}`)).to.be.true()
  })

  test('.set sets the value in yar', async () => {
    const VALUE = 'test-value'
    slice.set(request, KEY, VALUE)
    expect(request.yar.set.calledWith(`${KEY_PREFIX}.${KEY}`, VALUE)).to.be.true()
  })

  test('.merge merges top-level properties with those already stored', async () => {
    request.yar.get.returns({
      foo: 'bar'
    })

    const VALUE = 'test-value'
    slice.merge(request, KEY, {
      value: VALUE
    })
    expect(request.yar.set.calledWith(`${KEY_PREFIX}.${KEY}`, {
      foo: 'bar',
      value: VALUE
    })).to.be.true()
  })

  test('.setProperty sets a property deep within the stored session data', async () => {
    request.yar.get.returns({
      data: {
        foo: 'bar'
      }
    })

    const VALUE = 'test-value'
    slice.setProperty(request, KEY, 'data.value', VALUE)
    expect(request.yar.set.calledWith(`${KEY_PREFIX}.${KEY}`, {
      data: {
        foo: 'bar',
        value: VALUE
      }
    })).to.be.true()
  })
})
