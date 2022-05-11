'use strict';

const adjustments = (formValues, requestPayload = {}) => {
  return formValues.adjustments.length > 0
    ? {
      isAdjustments: true,
      adjustments: {
        aggregate: formValues.adjustments.includes('aggregate') ? requestPayload.aggregateFactor : null,
        charge: formValues.adjustments.includes('charge') ? requestPayload.chargeFactor : null,
        s126: formValues.adjustments.includes('s126') ? requestPayload.s126Factor : null,
        s127: formValues.adjustments.includes('s127'),
        s130: formValues.adjustments.includes('s130'),
        winter: formValues.adjustments.includes('winter')
      }
    }
    : { isAdjustments: false, adjustments: {} };
};

exports.adjustments = adjustments;
