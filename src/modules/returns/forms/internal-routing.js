const { formFactory, fields } = require('../../../lib/forms');
const { STEP_INTERNAL_ROUTING, getPath } = require('../lib/flow-helpers');

/**
 * Gets radio button options depending on return state
 * @param {Object} data - return model data
 * @return {Array} array of choices for radio buttons
 */
const getChoices = (data) => {
  const choices = [];

  choices.push({ value: 'submit', label: 'Enter and submit' });

  if (data.isUnderQuery === true) {
    choices.push({ value: 'clear_under_query', label: 'Resolve query' });
  } else {
    choices.push({ value: 'set_under_query', label: 'Record under query' });
  }

  // Only add option to log receipt of form if not yet received
  if (data.receivedDate === null) {
    choices.push({ value: 'log_receipt', label: 'Record receipt' });
  }

  return choices;
};

const form = (request, data) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_INTERNAL_ROUTING, request);

  const f = formFactory(action);

  f.fields.push(fields.radio('action', {
    label: 'What do you want to do with this return?',
    errors: {
      'any.required': {
        message: 'Select what you want to do with this return'
      }
    },
    choices: getChoices(data)
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

module.exports = {
  internalRoutingForm: form
};
