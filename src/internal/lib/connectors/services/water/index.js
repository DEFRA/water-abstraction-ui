const LicencesAPIClient = require('shared/lib/connectors/services/water/licences');
const http = require('shared/lib/connectors/http');

module.exports = config => ({
  licences: new LicencesAPIClient(http.request, { endpoint: `${config.services.water}/documents` })
});
