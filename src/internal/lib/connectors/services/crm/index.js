const EntitiesApiClient = require('shared/lib/connectors/services/crm/EntitiesApiClient');
const EntityRolesApiClient = require('shared/lib/connectors/services/crm/EntityRolesApiClient');
const DocumentVerificationsApiClient = require('shared/lib/connectors/services/crm/DocumentVerificationsApiClient');
const DocumentsApiClient = require('shared/lib/connectors/services/crm/DocumentsApiClient');
const VerificationsApiClient = require('shared/lib/connectors/services/crm/VerificationsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  entities: new EntitiesApiClient(config, logger),
  entityRoles: new EntityRolesApiClient(config, logger),
  documentVerifications: new DocumentVerificationsApiClient(config, logger),
  documents: new DocumentsApiClient(config, logger),
  verifications: new VerificationsApiClient(config, logger)
});
