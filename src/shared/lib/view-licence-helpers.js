/**
 * Formats data commonly used in views, assuming that licence data has been
 * loaded by the licenceData plugin
 * @param  {Object} request - hapi request
 * @return {Object}           view data
 */
const getCommonViewContext = request => {
  const { documentId } = request.params;
  return {
    ...request.view,
    ...request.licence,
    documentId
  };
};

const getCommonBackLink = request => {
  const { documentId } = request.params;
  const { licenceNumber } = request.licence.summary;
  return {
    back: `/licences/${documentId}`,
    backText: `Licence number ${licenceNumber}`
  };
};

exports.getCommonViewContext = getCommonViewContext;
exports.getCommonBackLink = getCommonBackLink;
