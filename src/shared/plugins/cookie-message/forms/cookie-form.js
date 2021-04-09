'use strict';

const { formFactory, fields } = require('shared/lib/forms/');

const choices = [
  {
    value: true,
    label: 'Yes'
  },
  {
    value: false,
    label: 'No'
  }
];

/**
 * Creates an object to represent the form for capturing the
 * bill run type i.e. annual...
 *
 * @param {Object} request The Hapi request object
 * @param {string} billRunType The type of bill run selected
  */
const cookieForm = request => {
  const f = formFactory(request.path, 'POST');

  // Radio field should default to "No"
  // See https://design-system.service.gov.uk/patterns/cookies-page/
  const value = request.isAnalyticsCookiesEnabled(request) || false;

  f.fields.push(fields.radio('acceptAnalyticsCookies', {
    label: 'Do you want to accept analytics cookies?',
    mapper: 'booleanMapper',
    errors: {
      'any.required': {
        message: 'Select if you want to accept analytics cookies'
      }
    },
    choices
  }, value));
  f.fields.push(fields.button(null, { label: 'Save cookie settings' }));

  return f;
};

exports.form = cookieForm;
