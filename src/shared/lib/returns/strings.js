/**
 * Checks whether supplied string is a return ID as currently supported in
 * the digital service.  This consists of a version prefix, region code,
 * licence number, format ID and return cycle date range
 * @param {String} returnId - the string to test
 * @return {Boolean} true if match
 */
const isReturnId = (returnId) => {
  const r = /^v1:[1-8]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  return r.test(returnId);
};

exports.isReturnId = isReturnId;
