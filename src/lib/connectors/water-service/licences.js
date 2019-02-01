const serviceRequest = require('../service-request');
const { partialRight } = require('lodash');

const get = (documentId, tail) => {
  const baseUrl = `${process.env.WATER_URI}/documents/${documentId}/licence`;
  const url = tail ? `${baseUrl}/${tail}` : baseUrl;
  return serviceRequest.get(url);
};

const getLicenceByDocumentId = documentId => get(documentId);

const getLicenceConditionsByDocumentId = partialRight(get, 'conditions');

const getLicencePointsByDocumentId = partialRight(get, 'points');

const getLicenceUsersByDocumentId = partialRight(get, 'users');

const getLicencePrimaryUserByDocumentId = async documentId => {
  try {
    const userResponse = await getLicenceUsersByDocumentId(documentId);

    if (!userResponse.error) {
      const users = userResponse.data || [];
      return users.find(user => user.roles.includes('primary_user'));
    }
  } catch (error) {
    if (error.statusCode !== 404) {
      throw error;
    }
  }
};

module.exports = {
  getLicenceByDocumentId,
  getLicenceConditionsByDocumentId,
  getLicencePointsByDocumentId,
  getLicenceUsersByDocumentId,
  getLicencePrimaryUserByDocumentId
};
