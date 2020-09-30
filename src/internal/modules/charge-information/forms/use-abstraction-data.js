'use strict';

const { get } = require('lodash');
const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');
const { getActionUrl } = require('../lib/form-helpers');

const useAbstractionDataForm = request => {
  const { csrfToken } = request.view;
  const { licence, draftChargeInformation } = request.pre;

  const useAbstractionData = get(draftChargeInformation, 'abstractionData');

  const action = getActionUrl(request, routing.getUseAbstractionData(licence.id));

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('useAbstractionData', {
    errors: {
      'any.required': {
        message: 'Select whether to use abstraction data to set up the element'
      }
    },
    choices: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  }, useAbstractionData));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const useAbstractionDataSchema = () => {
  return {
    csrf_token: Joi.string().uuid().required(),
    useAbstractionData: Joi.boolean().required()
  };
};

exports.form = useAbstractionDataForm;
exports.schema = useAbstractionDataSchema;
