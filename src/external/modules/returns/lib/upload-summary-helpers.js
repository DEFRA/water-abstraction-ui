const moment = require('moment');
const { get, groupBy, mapValues, pick } = require('lodash');

/**
 * Maps data from current request to the body expected in the postUploadPreview
 * API call
 * @param  {Object} request - current HAPI request
 * @return {Object} qs options for postUploadPreview
 */
const mapRequestOptions = request => pick(request.defra, ['userName', 'entityId', 'companyId']);

const getReturnRequirmentFromId = returnId => returnId.split(':')[3];

const getReturnQuantitiesPath = (ret, eventId) => {
  const hasErrors = ret.errors.length > 0;
  return hasErrors ? null : `/returns/upload-summary/${eventId}/${ret.returnId}`;
};

/**
 * Maps return from water service returns API call to shape expected by view
 * @param  {Obiject} ret    - return loaded from water service API upload preview
 * @param  {String} eventId - the event ID
 * @return {Object}         return with returnRequirement and path added
 */
const mapReturn = (ret, eventId) => {
  return {
    ...ret,
    returnRequirement: getReturnRequirmentFromId(ret.returnId),
    path: getReturnQuantitiesPath(ret, eventId)
  };
};

const hasErrors = ret => get(ret, 'errors.length') > 0;
const getGroup = ret => hasErrors(ret) ? 'returnsWithErrors' : 'returnsWithoutErrors';
/**
 * Groups and maps returns into those with and without validation errors
 * @param  {Array} returns - an array of returns from the upload validation endpoint
 * @return {Object} two groups of returns, { returnsWithErrors, returnsWithoutErrors }
 */
const groupReturns = (returns, eventId) => {
  const mapped = returns.map(ret => mapReturn(ret, eventId));
  return groupBy(mapped, getGroup);
};

const groupLines = (ret) => {
  if (ret.frequency !== 'day') {
    return [ { lines: ret.lines } ];
  }
  // Group returns by month
  const obj = groupBy(ret.lines, line => moment(line.startDate).format('MMMM YYYY'));

  const mapped = mapValues(obj, (lines, key) => {
    return {
      title: key,
      lines
    };
  });

  return Object.values(mapped);
};

exports.mapRequestOptions = mapRequestOptions;
exports.mapReturn = mapReturn;
exports.groupReturns = groupReturns;
exports.groupLines = groupLines;
