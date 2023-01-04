const SystemApiClient = require('shared/lib/connectors/services/system/SystemApiClient')

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

experiment('shared/services/SystemApiClient', () => {
  let logger
  let config
  let client

  beforeEach(async () => {
    logger = {}
    config = {
      jwt: {
        token: 'test-jwt-token'
      },
      services: {
        system: 'https://example.com'
      }
    }

    client = new SystemApiClient(config, logger)
  })

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com')
    })

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token')
    })

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com')
    })
  })
})
