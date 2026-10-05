'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { http } = require('@envage/water-abstraction-helpers')
const EntityRolesApiClient = require('../../../../../../src/shared/lib/connectors/services/crm/EntityRolesApiClient')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const config = {
  services: { crm: 'https://example.com/crm/1.0' },
  jwt: { token: 'test-token' }
}

const logger = { error: () => {} }

// Stands in for the CRM API. The first page request for each entity waits a different time, so calls for different
// entities overlap. Each response returns a row for the entity found in the requested URL
const fakeRequest = async options => {
  const [, entityId] = options.uri.match(/entity\/([^/]+)\/roles/)

  if (!options.qs.pagination) {
    await delay(entityId === 'entity-a' ? 30 : 5)

    return { error: null, pagination: { page: 1, pageCount: 1, perPage: 100 }, data: [] }
  }

  return { error: null, data: [{ entity_id: entityId }] }
}

experiment('shared/lib/connectors/services/crm/EntityRolesApiClient', () => {
  let client

  beforeEach(async () => {
    sandbox.stub(http, 'request').callsFake(fakeRequest)

    client = new EntityRolesApiClient(config, logger)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getEntityRoles', () => {
    test('requests the roles for the entity and returns the rows from all pages', async () => {
      const roles = await client.getEntityRoles('entity-a')

      expect(roles).to.equal([{ entity_id: 'entity-a' }])

      const uris = http.request.getCalls().map(call => call.args[0].uri)

      expect(uris).to.equal([
        'https://example.com/crm/1.0/entity/entity-a/roles',
        'https://example.com/crm/1.0/entity/entity-a/roles'
      ])
    })

    test('sends the auth headers', async () => {
      await client.getEntityRoles('entity-a')

      expect(http.request.firstCall.args[0].headers).to.equal({ Authorization: 'test-token' })
    })

    experiment('when calls for different entities overlap', () => {
      test('each call only requests and returns its own entity\'s roles', async () => {
        const [rolesA, rolesB] = await Promise.all([
          client.getEntityRoles('entity-a'),
          client.getEntityRoles('entity-b')
        ])

        expect(rolesA).to.equal([{ entity_id: 'entity-a' }])
        expect(rolesB).to.equal([{ entity_id: 'entity-b' }])
      })
    })
  })
})
