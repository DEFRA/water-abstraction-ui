const DocumentRolesApiClient = require('shared/lib/connectors/services/crm/DocumentRolesApiClient')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

experiment('DocumentRolesApiClient', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getDocumentRolesByDocumentRef', () => {
    const LICENCE = '01/123'

    test('call to .getDocumentRolesByDocumentRef uses correct argument', async () => {
      const service = new DocumentRolesApiClient()
      await service.getDocumentRolesByDocumentRef(LICENCE)
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.contain('document/01%2F123/document-roles')
    })
  })

  experiment('.getFullHistoryOfDocumentRolesByDocumentRef', () => {
    const LICENCE = '01/123'

    test('call to .getFullHistoryOfDocumentRolesByDocumentRef uses correct argument', async () => {
      const service = new DocumentRolesApiClient()
      await service.getFullHistoryOfDocumentRolesByDocumentRef(LICENCE)
      const [url, options] = serviceRequest.get.lastCall.args

      expect(url).to.contain('document/01%2F123/document-roles')
      expect(options.qs).to.equal({
        includeHistoricRoles: true
      })
    })
  })
})
