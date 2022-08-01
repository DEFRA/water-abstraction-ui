const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const BatchNotificationsService = require('internal/lib/connectors/services/water/BatchNotificationsService')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

experiment('services/water/BatchNotificationsService', () => {
  let client

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post')
    client = new BatchNotificationsService('https/example.com/water')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.prepareReturnsReminders', () => {
    beforeEach(async () => {
      await client.prepareReturnsReminders('issuer', '1,2')
    })

    test('passes the expected URL to the request', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('https/example.com/water/batch-notifications/prepare/returnReminder')
    })

    test('adds the issuer to the request body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body.issuer).to.equal('issuer')
    })

    test('adds the exclude licences values to the request body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body.data.excludeLicences).to.equal('1,2')
    })
  })

  experiment('prepareReturnsInvitations', () => {
    beforeEach(async () => {
      await client.prepareReturnsInvitations('issuer', '1,2')
    })

    test('passes the expected URL to the request', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('https/example.com/water/batch-notifications/prepare/returnInvitation')
    })

    test('adds the issuer to the request body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body.issuer).to.equal('issuer')
    })

    test('adds the exclude licences values to the request body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body.data.excludeLicences).to.equal('1,2')
    })
  })

  experiment('preparePaperReturnForms', () => {
    beforeEach(async () => {
      await client.preparePaperReturnForms('issuer', {
        foo: 'bar'
      })
    })

    test('passes the expected URL to the request', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('https/example.com/water/batch-notifications/prepare/paperReturnForms')
    })

    test('adds the issuer to the request body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body.issuer).to.equal('issuer')
    })

    test('adds the data to the request body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body.data).to.equal({ foo: 'bar' })
    })
  })

  experiment('sendReminders', () => {
    beforeEach(async () => {
      await client.sendReminders('test-event-id', 'issuer')
    })

    test('passes the expected URL to the request', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('https/example.com/water/batch-notifications/send/test-event-id')
    })

    test('includes the issuer in the request body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body.issuer).to.equal('issuer')
    })
  })
})
