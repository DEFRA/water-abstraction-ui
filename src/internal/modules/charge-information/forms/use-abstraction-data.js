'use strict';

const { get } = require('lodash');
const Joi = require('@hapi/joi');
const moment = require('moment');

const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');
const { getActionUrl } = require('../lib/form-helpers');

const getAddionalChoices = (chargeVersions) => {
  if (chargeVersions.length > 0) {
    const choices = [{ divider: 'or' }];
    chargeVersions.map(cv => {
      choices.push(
        { value: cv.id,
          label: `Use charge information valid from ${moment(cv.dateRange.startDate).format('D MMMM YYYY')}`
        });
    });
    return choices;
  }
  return [];
};

const filterChargeVersions = chargeVersions => chargeVersions.filter(cv => cv.status === 'current');

const useAbstractionDataForm = request => {
  const { csrfToken } = request.view;
  const { licence, draftChargeInformation, chargeVersions } = request.pre;
  const useAbstractionData = get(draftChargeInformation, 'abstractionData');
  const choices = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    ...getAddionalChoices(filterChargeVersions(chargeVersions))
  ];

  const action = getActionUrl(request, routing.getUseAbstractionData(licence.id));

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('useAbstractionData', {
    errors: {
      'any.required': {
        message: 'Select whether to use abstraction data to set up the element'
      }
    },
    choices
  }, useAbstractionData));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const useAbstractionDataSchema = (request) => {
  const { chargeVersions } = request.pre;
  const validIds = filterChargeVersions(chargeVersions).map(cv => cv.id);
  return {
    csrf_token: Joi.string().uuid().required(),
    useAbstractionData: Joi.string().valid(['yes', 'no', ...validIds]).required()
  };
};

exports.form = useAbstractionDataForm;
exports.schema = useAbstractionDataSchema;
