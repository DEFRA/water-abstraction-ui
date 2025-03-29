'use strict'

const { expect } = require('@hapi/code')
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { get } = require('lodash')

const services = require('external/lib/connectors/services')
const helpers = require('external/modules/returns/lib/helpers')
const permissions = require('external/lib/permissions')

experiment('getLicenceReturns', () => {
  beforeEach(async () => {
    sandbox.stub(services.returns.returns, 'findMany').resolves({
      data: {},
      error: null,
      pagination: {}
    })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('omits void returns for external users', async () => {
    await helpers.getLicenceReturns([], 1, false)
    const filter = services.returns.returns.findMany.args[0][0]
    expect(get(filter, 'status.$ne')).to.equal('void')
  })
})

experiment('isBulkUpload', () => {
  let clock
  let testDate

  // Control what the current date is when the test is run
  beforeEach(() => {
    testDate = new Date(2025, 2, 29, 20, 31, 57)

    clock = sandbox.useFakeTimers(testDate)
  })

  afterEach(async () => {
    clock.restore()
    sandbox.restore()
  })

  experiment('pagination.totalRows > 0', () => {
    beforeEach(async () => {
      sandbox.stub(services.returns.returns, 'findMany').resolves({
        data: {},
        error: null,
        pagination: {
          totalRows: 3
        }
      })
    })

    test('returns true for external CSV Upload user', async () => {
      const result = await helpers.isBulkUpload([])
      expect(result).to.equal(true)
    })
  })

  experiment('filters returns to ensure one or more returns', () => {
    let filter

    beforeEach(async () => {
      sandbox.stub(services.returns.returns, 'findMany').resolves({
        data: {},
        error: null,
        pagination: {
          totalRows: 3
        }
      })
      await helpers.isBulkUpload(['01/123', '04/567'], '2019-05-05')
      filter = services.returns.returns.findMany.lastCall.args[0]
    })

    test('have the bulk upload flag set', async () => {
      expect(filter['metadata->>isUpload']).to.equal('true')
    })

    test('relate to the current licence version', async () => {
      expect(filter['metadata->>isCurrent']).to.equal('true')
    })

    test('have "due" status', async () => {
      expect(filter.status).to.equal('due')
    })

    test('have an end date after or on the 2018-10-31', async () => {
      expect(filter.end_date).to.equal({
        $gte: '2018-10-31',
        $lte: testDate
      })
    })

    test('have an end date before or on the current date', async () => {
      expect(filter.end_date).to.equal({
        $gte: '2018-10-31',
        $lte: testDate
      })
    })

    test('are for the users\' licence numbers', async () => {
      expect(filter.licence_ref).to.equal({
        $in: ['01/123', '04/567']
      })
    })
  })

  experiment('pagination.totalRows === 0', () => {
    beforeEach(async () => {
      sandbox.stub(services.returns.returns, 'findMany').resolves({
        data: {},
        error: null,
        pagination: {
          totalRows: 0
        }
      })
    })

    afterEach(async () => {
      sandbox.restore()
    })
    test('returns false for regular external user', async () => {
      const result = await helpers.isBulkUpload([])
      expect(result).to.equal(false)
    })
  })
})

experiment('getNewTaggingLicenceNumbers', () => {
  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'findAll').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('requests the required columns', async () => {
    await helpers.getNewTaggingLicenceNumbers({})
    const [, , columns] = services.crm.documents.findAll.lastCall.args
    expect(columns).to.only.include([
      'system_external_id',
      'document_name',
      'document_id',
      'metadata'
    ])
  })

  test('does not expired licences for external users', async () => {
    const request = {}
    await helpers.getNewTaggingLicenceNumbers(request)
    const [filter] = services.crm.documents.findAll.lastCall.args
    expect(get(filter, 'includeExpired')).to.be.undefined()
  })
})

experiment('getReturnsViewData', () => {
  let request
  beforeEach(async () => {
    request = {
      params: { documentId: 'test-doc-id' },
      query: { page: 1 },
      view: { test: 'some-view-stuff' }
    }

    sandbox.stub(services.crm.documents, 'findAll').resolves([])
    sandbox.stub(services.returns.returns, 'findMany').resolves({ error: null, pagination: { totalRows: 1 } })
    sandbox.stub(permissions, 'isReturnsUser').returns(true)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('calls CRM with expected filter', async () => {
    await helpers.getReturnsViewData(request)
    const [filter] = services.crm.documents.findAll.lastCall.args
    expect(filter).to.contain({ document_id: request.params.documentId })
  })

  test('does not include documentId in CRM call if not provided', async () => {
    request.params = {}
    await helpers.getReturnsViewData(request)
    const [filter] = services.crm.documents.findAll.lastCall.args
    expect(filter).not.to.contain({ document_id: request.params.documentId })
  })

  test('bulkUpload is true when isBulkUpload and isReturnsUser both return true', async () => {
    const view = await helpers.getReturnsViewData(request)
    expect(view.bulkUpload).to.be.true()
  })

  test('bulkUpload is false when isBulkUpload returns false', async () => {
    services.returns.returns.findMany.resolves({ error: null, pagination: { totalRows: 0 } })
    const view = await helpers.getReturnsViewData(request)
    expect(view.bulkUpload).to.be.false()
  })

  test('bulkUpload is false when isReturnsUser returns false', async () => {
    permissions.isReturnsUser.returns(false)
    const view = await helpers.getReturnsViewData(request)
    expect(view.bulkUpload).to.be.false()
  })

  test('returns the view with expected data', async () => {
    const view = await helpers.getReturnsViewData(request)
    expect(view).to.contain(request.view)
    expect(view).to.contain('documents')
    expect(view).to.contain('document')
    expect(view.bulkUpload).to.be.boolean()
    expect(view.returns).to.be.an.array()
  })
})
