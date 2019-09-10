'use strict';

function formatGridReference (reference) {
  // The length of one of the numbers in the NGR is the length of the whole thing
  // minus the two letters at the start, then divided by two (as there are two numbers)
  const accuracy = (reference.length - 2) / 2;

  return reference.substring(0, 2) + ' ' +
    reference.substring(2, 2 + accuracy) + ' ' +
    reference.substring(2 + accuracy);
}

/**
 * Format NGR point string, e.g. ST123456 so it has spaces, e.g. ST 123 456
 */
const ngrPointStr = str => {
  const prefix = str.substr(0, 2);
  const length = (str.length - 2) / 2;
  return prefix + ' ' + str.substr(2, length) + ' ' + str.substr(2 + length, length);
};

const formatResponse = point => {
  if (point.ngr4) {
    return `Within the area formed by the straight lines running between National Grid References ` +
      formatGridReference(point.ngr1) + ', ' +
      formatGridReference(point.ngr2) + ', ' +
      formatGridReference(point.ngr3) + ' and ' +
      formatGridReference(point.ngr4);
  }

  if (point.ngr2) {
    return `Between National Grid References ` + formatGridReference(point.ngr1) + ` and ` + formatGridReference(point.ngr2);
  }

  return `At National Grid Reference ` + formatGridReference(point.ngr1);
};

const addPointNameToResponse = (response, point) => {
  return (point.name && point.name.length !== 0)
    ? `${response} (${point.name})`
    : response;
};

const ngrPoint = (points) => {
  if (typeof (points) === 'undefined') {
    return null;
  }

  const point = 'ngr1' in points ? points : points[0];

  return addPointNameToResponse(formatResponse(point), point);
};

exports.ngrPoint = ngrPoint;
exports.ngrPointStr = ngrPointStr;
