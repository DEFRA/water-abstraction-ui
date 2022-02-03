'use strict';

const adjustments = formValues => {
  return formValues.adjustments.length > 0
    ? {
        adjustments: {
          aggregate: formValues.adjustments.includes('aggregate') ? formValues.aggregateFactor : null,
          charge: formValues.adjustments.includes('charge') ? formValues.chargeFactor : null,
          s126: formValues.adjustments.includes('s126') ? formValues.s126Factor : null,
          s127: formValues.adjustments.includes('s127'),
          s130: formValues.adjustments.includes('s130'),
          winter: formValues.adjustments.includes('winter')
        }
      }
    : { adjustments: [] };
};

exports.adjustments = adjustments;
