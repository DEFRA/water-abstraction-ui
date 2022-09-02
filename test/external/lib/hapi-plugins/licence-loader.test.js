const Hapi = require('@hapi/hapi')
const { expect } = require('@hapi/code')
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { set, get } = require('lodash')

const licenceLoaderPlugin = require('external/lib/hapi-plugins/licence-loader')

const requestStubPlugin = require('./request-stub-plugin')
const services = require('external/lib/connectors/services')

const addEntityIdToRequest = request => {
  set(request, 'auth.isAuthenticated', true)
  set(request, 'defra.entityId', 'test-entity-id')
}

const getServer = async (licenceLoaderSettings) => {
  const server = Hapi.server()
  await server.register([
    {
      plugin: requestStubPlugin,
      options: { onPostAuth: addEntityIdToRequest }
    },
    { plugin: licenceLoaderPlugin }
  ])

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'ok',
    config: {
      plugins: {
        licenceLoader: licenceLoaderSettings
      }
    }
  })

  return server
}

experiment('loadUserLicenceCount', () => {
  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'getLicenceCount')
    sandbox.stub(services.crm.verifications, 'getOutstandingVerifications')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('when loadUserLicenceCount is true the data is added to the request', async () => {
    services.crm.documents.getLicenceCount.resolves(2)
    const loaderSettings = { loadUserLicenceCount: true }
    const server = await getServer(loaderSettings)
    const request = { url: '/' }

    const response = await server.inject(request)

    expect(response.request.licence.userLicenceCount).to.equal(2)
  })

  test('when loadUserLicenceCount is not true, the data is not added to the request', async () => {
    const loaderSettings = {}
    const server = await getServer(loaderSettings)
    const request = { url: '/' }

    const response = await server.inject(request)

    const licence = get(response, 'request.licence', {})
    expect(licence.userLicenceCount).to.be.undefined()
  })

  test('when loadOutstandingVerifications is true the data is added to the request', async () => {
    services.crm.verifications.getOutstandingVerifications.resolves({
      data: [{ id: 1 }]
    })
    const loaderSettings = { loadOutstandingVerifications: true }
    const server = await getServer(loaderSettings)
    const request = { url: '/' }

    const response = await server.inject(request)

    expect(response.request.licence.outstandingVerifications).to.equal([{ id: 1 }])
  })

  test('when loadOutstandingVerifications is not true, the data is not added to the request', async () => {
    const loaderSettings = {}
    const server = await getServer(loaderSettings)
    const request = { url: '/' }

    const response = await server.inject(request)

    const licence = get(response, 'request.licence', {})
    expect(licence.outstandingVerifications).to.be.undefined()
  })

  test('all requested data is loaded for multilpe keys', async () => {
    services.crm.verifications.getOutstandingVerifications.resolves({
      data: [{ id: 1 }]
    })
    services.crm.documents.getLicenceCount.resolves(2)

    const loaderSettings = {
      loadUserLicenceCount: true,
      loadOutstandingVerifications: true
    }
    const server = await getServer(loaderSettings)
    const request = { url: '/' }

    const response = await server.inject(request)

    expect(response.request.licence.outstandingVerifications).to.equal([{ id: 1 }])
    expect(response.request.licence.userLicenceCount).to.equal(2)
  })
})
