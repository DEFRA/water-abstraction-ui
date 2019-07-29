const { formFactory, fields } = require('shared/lib/forms');
const { STEP_INTERNAL_ROUTING } = require('shared/modules/returns/steps');
const { addQuery } = require('shared/modules/returns/route-helpers');

const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

const isReceived = data => data.receivedDate !== null;
const isUnderQuery = data => data.isUnderQuery;

const showSetQuery = data => isReceived(data) && !isUnderQuery(data);
const showClearQuery = data => isReceived(data) && isUnderQuery(data);

/**
 * Gets radio button options depending on return state
 * @param {Object} data - return model data
 * @return {Array} array of choices for radio buttons
 */
const getChoices = (data) => {
  const choices = [];

  choices.push({ value: 'submit', label: 'Enter and submit' });

  // Only add option to log receipt of form if not yet received
  if (!isReceived(data)) {
    choices.push({ value: 'log_receipt', label: 'Record receipt' });
  }

  if (showSetQuery(data)) {
    choices.push({ value: 'set_under_query', label: 'Record under query' });
  }
  if (showClearQuery(data)) {
    choices.push({ value: 'clear_under_query', label: 'Resolve query' });
  }

  return choices;
};

const getRadioField = data => fields.radio('action', {
  label: 'What do you want to do with this return?',
  subHeading: true,
  errors: {
    'any.required': {
      message: 'Select what you want to do with this return'
    }
  },
  choices: getChoices(data)
});

const form = (request, data) => ({
  ...formFactory(addQuery(request, STEP_INTERNAL_ROUTING)),
  fields: [
    getRadioField(data),
    getCsrfTokenField(request),
    getContinueField()
  ]
});

module.exports = {
  internalRoutingForm: form
};
