const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const ContactsService = require('shared/lib/connectors/services/water/ContactsService')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

const BASE_URL = 'http://127.0.0.1:8001/water/1.0'

experiment('services/water/ContactsService', () => {
  let service

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get')
    sandbox.stub(serviceRequest, 'patch')
    sandbox.stub(serviceRequest, 'post')
    service = new ContactsService(BASE_URL)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getContact', () => {
    test('passes the expected URL to the service request', async () => {
      await service.getContact('entity_1')
      const expectedUrl = `${BASE_URL}/contact/entity_1`
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal(expectedUrl)
    })
  })

  //
  experiment('.postContact', () => {
    test('passes the expected URL to the service request', async () => {
      await service.postContact({ some: 'payload' }, 'some-role')
      const expectedUrl = `${BASE_URL}/contacts`
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal(expectedUrl)
    })
  })

  experiment('.patchContact', () => {
    test('passes the expected URL to the service request', async () => {
      await service.patchContact('entity_1', { some: 'payload' })
      const expectedUrl = `${BASE_URL}/contact/entity_1`
      const [url] = serviceRequest.patch.lastCall.args
      expect(url).to.equal(expectedUrl)
    })
  })
})
