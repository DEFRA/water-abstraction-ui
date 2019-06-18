const EntitiesApiClient = require('shared/lib/connectors/services/crm/EntitiesApiClient');
const DocumentVerificationApiClient = require('shared/lib/connectors/services/crm/DocumentVerificationApiClient');
const KpiApiClient = require('shared/lib/connectors/services/crm/KpiApiClient');
const EntityRolesApiClient = require('./EntityRolesApiClient');
const DocumentsApiClient = require('./DocumentsApiClient');
const VerificationsApiClient = require('./VerificationsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  entities: new EntitiesApiClient(config, logger),
  entityRoles: new EntityRolesApiClient(config, logger),
  documentVerification: new DocumentVerificationApiClient(config, logger),
  documents: new DocumentsApiClient(config, logger),
  kpis: new KpiApiClient(config, logger),
  verifications: new VerificationsApiClient(config, logger)
});
