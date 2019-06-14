const EntitiesApiClient = require('shared/lib/connectors/services/crm/EntitiesApiClient');
const EntityRolesApiClient = require('shared/lib/connectors/services/crm/EntityRolesApiClient');
const DocumentVerificationApiClient = require('shared/lib/connectors/services/crm/DocumentVerificationApiClient');
const DocumentsApiClient = require('shared/lib/connectors/services/crm/DocumentsApiClient');
const KpiApiClient = require('shared/lib/connectors/services/crm/KpiApiClient');
const VerificationsApiClient = require('shared/lib/connectors/services/crm/VerificationsApiClient');

const { logger } = require('../../../../logger');

module.exports = config => ({
  entities: new EntitiesApiClient(config, logger),
  entityRoles: new EntityRolesApiClient(config, logger),
  documentVerification: new DocumentVerificationApiClient(config, logger),
  documents: new DocumentsApiClient(config, logger),
  kpis: new KpiApiClient(config, logger),
  verifications: new VerificationsApiClient(config, logger)
});
