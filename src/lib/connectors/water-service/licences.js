const rp = require('request-promise-native').defaults({ proxy: null, strictSSL: false });

const get = (documentId, tail) => {
  const url = `${process.env.WATER_URI}/documents/${documentId}/licence`;
  return tail ? rp(`${url}/${tail}`) : rp(url);
};

const getLicenceByDocumentId = documentId => get(documentId);

const getLicenceConditionsByDocumentId = documentId => get(documentId, 'conditions');

const getLicencePointsByDocumentId = documentId => get(documentId, 'points');

module.exports = {
  getLicenceByDocumentId,
  getLicenceConditionsByDocumentId,
  getLicencePointsByDocumentId
};
