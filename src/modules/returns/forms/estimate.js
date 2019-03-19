const { get } = require('lodash');
const { formFactory, fields } = require('../../../lib/forms');
const { STEP_ESTIMATE_BASIS, getPath } = require('../lib/flow-helpers');

const estimateBasisForm = (request, data) => {
  const { csrfToken } = request.view;
  const action = getPath(STEP_ESTIMATE_BASIS, request);

  const f = formFactory(action);

  f.fields.push(fields.paragraph(null, {
    text: 'Reporting without a meter', controlClass: 'text-medium' }));

  f.fields.push(fields.radio('method', {
    label: 'What are the abstraction volumes based on?',
    errors: {
      'any.required': {
        message: 'Select one of the options'
      }
    },
    choices: [
      { value: 'agreedAgency', label: 'As agreed with Agency' },
      { value: 'estimatedVolumes', label: 'Estimated volume' },
      { value: 'knownAreaTimesDepth', label: 'Known Area x Depth' },
      { value: 'knownCapacityTimesFills', label: 'Known Capacity x No Of Fills' },
      { value: 'flowMeasuringStructure', label: 'Level/Stage at Flow Measuring Structure' },
      { value: 'mixedMeans', label: 'Mixed Means' },
      { value: 'noMeansRequired', label: 'No Means Required (Temp or Trans Type Licence - No Quantities)' },
      { value: 'livestockStandardRate', label: 'Nos of Livestock x Standard Rate' },
      { value: 'otherMeans', label: 'Other Means' },
      { value: 'powerConsumed', label: 'Power Consumed' },
      { value: 'powerGenerated', label: 'Power Generated' },
      { value: 'pumpRateByTime', label: 'Pump Rate x Time' },
      { value: 'Other', label: 'Other' }
    ] }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = estimateBasisForm;
