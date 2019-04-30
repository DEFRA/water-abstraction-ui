const serviceRequest = require('../service-request');
const config = require('../../../../config');

const get = (documentId, tail, includeExpired = false) => {
  const baseUrl = `${config.services.water}/documents/${documentId}/licence`;

  let url = tail ? `${baseUrl}/${tail}` : baseUrl;

  if (includeExpired) {
    url += '?includeExpired=true';
  }

  return serviceRequest.get(url);
};

const getLicenceByDocumentId = (documentId, includeExpired) => get(documentId, null, includeExpired);

const getLicenceConditionsByDocumentId = documentId => get(documentId, 'conditions');

const getLicencePointsByDocumentId = documentId => get(documentId, 'points');

const getLicenceUsersByDocumentId = (documentId, includeExpired) => get(documentId, 'users', includeExpired);

const getLicencePrimaryUserByDocumentId = async (documentId, includeExpired = false) => {
  try {
    const userResponse = await getLicenceUsersByDocumentId(documentId, includeExpired);
    const users = userResponse.data || [];
    return users.find(user => user.roles.includes('primary_user'));
  } catch (error) {
    if (error.statusCode !== 404) {
      throw error;
    }
  }
};

const getLicenceSummaryByDocumentId = documentId => get(documentId, 'summary');

const getLicenceCommunicationsByDocumentId = (documentId, includeExpired = false) => get(documentId, 'communications', includeExpired);

exports.getLicenceByDocumentId = getLicenceByDocumentId;
exports.getLicenceConditionsByDocumentId = getLicenceConditionsByDocumentId;
exports.getLicencePointsByDocumentId = getLicencePointsByDocumentId;
exports.getLicenceUsersByDocumentId = getLicenceUsersByDocumentId;
exports.getLicencePrimaryUserByDocumentId = getLicencePrimaryUserByDocumentId;
exports.getLicenceSummaryByDocumentId = getLicenceSummaryByDocumentId;
exports.getLicenceCommunicationsByDocumentId = getLicenceCommunicationsByDocumentId;
