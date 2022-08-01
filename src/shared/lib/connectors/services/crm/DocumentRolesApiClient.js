const ServiceClient = require('shared/lib/connectors/services/ServiceClient')
const urlJoin = require('url-join')
const config = require('../../../../../internal/config')

class DocumentsRolesApiClient extends ServiceClient {
  getDocumentRolesByDocumentRef (documentRef) {
    const serviceUrl = config.services.crm_v2
    const uri = urlJoin(serviceUrl, 'document', encodeURIComponent(documentRef), 'document-roles')
    return this.serviceRequest.get(uri)
  }

  getFullHistoryOfDocumentRolesByDocumentRef (documentRef) {
    const serviceUrl = config.services.crm_v2
    const uri = urlJoin(serviceUrl, 'document', encodeURIComponent(documentRef), 'document-roles')
    return this.serviceRequest.get(uri, {
      qs: {
        includeHistoricRoles: true
      }
    })
  }
}

module.exports = DocumentsRolesApiClient
