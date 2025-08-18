'use strict'

const { find } = require('lodash')
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()

const { expect } = require('@hapi/code')

const config = require('../../../../src/internal/config.js')
const sandbox = require('sinon').createSandbox()

const { getPropositionLinks } = require('internal/lib/view/proposition-links')
const { scope } = require('internal/lib/constants')

const getAuthenticatedRequest = (scope = []) => {
  return {
    view: {
      activeNavLink: 'change-password'
    },
    state: {
      sid: '00000000-0000-0000-0000-000000000000'
    },
    auth: {
      credentials: {
        userId: 'user_1',
        scope
      }
    }
  }
}

lab.experiment('getPropositionLinks', () => {
  lab.beforeEach(() => {
    sandbox.stub(config.featureToggles, 'useNewProfilePage').value(false)
  })

  lab.test('It should not display any links if the user is not authenticated', async () => {
    const request = {}
    const result = getPropositionLinks(request)
    expect(result.length).to.equal(0)
  })

  lab.afterEach(() => {
    sandbox.restore()
  })

  lab.test('It should display change password, signout links for internal users', async () => {
    const request = getAuthenticatedRequest()
    const links = getPropositionLinks(request)
    const ids = links.map(link => link.id)
    expect(ids).to.equal(['change-password', 'signout'])
  })

  lab.test('It should display contact details, change password, signout links for internal users with HoF notification scope', async () => {
    const request = getAuthenticatedRequest(scope.hofNotifications)
    const links = getPropositionLinks(request)
    const ids = links.map(link => link.id)
    expect(ids).to.equal(['contact-information', 'change-password', 'signout'])
  })

  lab.test('It should display contact details, change password, signout links for internal users with renewal notification scope', async () => {
    const request = getAuthenticatedRequest(scope.renewalNotifications)
    const links = getPropositionLinks(request)
    const ids = links.map(link => link.id)
    expect(ids).to.equal(['contact-information', 'change-password', 'signout'])
  })

  lab.test('It should set the active nav link flag', async () => {
    const request = getAuthenticatedRequest(true)
    const links = getPropositionLinks(request)
    const link = find(links, { id: 'change-password' })
    expect(link.active).to.equal(true)
  })

  lab.test('Non-active links should have the active flag set to false', async () => {
    const request = getAuthenticatedRequest()
    const links = getPropositionLinks(request)

    expect(find(links, { id: 'signout' }).active).to.equal(false)
  })

  lab.test('It should set ID attributes', async () => {
    const request = getAuthenticatedRequest(true)
    const links = getPropositionLinks(request)
    const idAttributes = links.map(link => link.attributes.id)
    expect(idAttributes).to.equal(['change-password', 'signout'])
  })
})
