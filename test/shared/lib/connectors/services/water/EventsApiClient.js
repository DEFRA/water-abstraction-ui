const EventsApiClient = require('shared/lib/connectors/services/water/EventsApiClient')

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

experiment('shared/services/EventsApiClient', () => {
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
        water: 'https://example.com/water'
      }
    }

    client = new EventsApiClient(config, logger)
  })

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/event')
    })

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token')
    })

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water')
    })
  })
})
