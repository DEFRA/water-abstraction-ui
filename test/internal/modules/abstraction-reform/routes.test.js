'use strict'

const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()

const { expect } = require('@hapi/code')
const constants = require('internal/lib/constants')
const scopes = [
  constants.scope.abstractionReformUser,
  constants.scope.abstractionReformApprover
]

const routes = require('internal/modules/abstraction-reform/routes')

lab.experiment('abstraction-reform - admin routes', () => {
  lab.test('getViewLicences has admin auth scopes', async () => {
    const route = routes.getViewLicences
    expect(route.options.auth.scope).to.equal(scopes)
  })

  lab.test('getViewLicence has admin auth scopes', async () => {
    const route = routes.getViewLicence
    expect(route.options.auth.scope).to.equal(scopes)
  })

  lab.test('getEditObject has admin auth scopes', async () => {
    const route = routes.getEditObject
    expect(route.options.auth.scope).to.equal(scopes)
  })

  lab.test('postEditObject has admin auth scopes', async () => {
    const route = routes.postEditObject
    expect(route.options.auth.scope).to.equal(scopes)
  })

  lab.test('postSetStatus has admin auth scopes', async () => {
    const route = routes.postSetStatus
    expect(route.options.auth.scope).to.equal(scopes)
  })
})
