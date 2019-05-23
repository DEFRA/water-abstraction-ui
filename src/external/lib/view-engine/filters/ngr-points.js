/**
 * Creates extraction point/s description string based on number of grid reference points
 * @param  {Object} points contains details of extraction point, including 1, 2 or 4 grid references
 * @return {String}        description of extraction points
 */
const ngrPoints = points => {
  if (typeof (points) === 'undefined') {
    return null;
  }

  var response = '';

  var point = 'ngr1' in points ? points : points[0];

  if (point.ngr4) {
    response = `Within the area formed by the straight lines running between National Grid References ` +
      formatGridReference(point.ngr1) + ', ' +
      formatGridReference(point.ngr2) + ', ' +
      formatGridReference(point.ngr3) + ' and ' +
      formatGridReference(point.ngr4);
  } else if (point.ngr2) {
    response = `Between National Grid References ` + formatGridReference(point.ngr1) + ` and ` + formatGridReference(point.ngr2);
  } else {
    response = `At National Grid Reference ` + formatGridReference(point.ngr1);
  }
  if (point.name && point.name.length !== 0) {
    response += ` (${point.name})`;
  }

  return response;
};

/**
 * Format NGR point string, e.g. ST123456 so it has spaces, e.g. ST 123 456
 */
const formatGridReference = reference => {
  // The length of one of the numbers in the NGR is the length of the whole thing
  // minus the two letters at the start, then divided by two (as there are two numbers)
  var accuracy = (reference.length - 2) / 2;
  return reference.substring(0, 2) + ' ' +
    reference.substring(2, 2 + accuracy) + ' ' +
    reference.substring(2 + accuracy);
};

module.exports = {
  ngrPoints
};
