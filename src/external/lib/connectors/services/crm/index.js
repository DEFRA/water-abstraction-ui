const EntitiesApiClient = require('shared/lib/connectors/services/crm/EntitiesApiClient')
const DocumentVerificationsApiClient = require('shared/lib/connectors/services/crm/DocumentVerificationsApiClient')
const EntityRolesApiClient = require('./EntityRolesApiClient')
const DocumentsApiClient = require('./DocumentsApiClient')
const VerificationsApiClient = require('./VerificationsApiClient')

const { logger } = require('../../../../logger')

module.exports = config => ({
  entities: new EntitiesApiClient(config, logger),
  entityRoles: new EntityRolesApiClient(config, logger),
  documentVerifications: new DocumentVerificationsApiClient(config, logger),
  documents: new DocumentsApiClient(config, logger),
  verifications: new VerificationsApiClient(config, logger)
})
