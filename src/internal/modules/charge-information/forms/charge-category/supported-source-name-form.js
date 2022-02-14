const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers');
const { ROUTING_CONFIG } = require('../../lib/charge-categories/constants');
const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');

const getChoices = (config, supportedSources) => {
  const choices = supportedSources.reduce((reducedChoices, source, index) => {
    const choice = { value: source.id, label: source.name };
    const lastSource = index ? supportedSources[index - 1] : {};
    if (source.region !== lastSource.region) {
      return [...reducedChoices, { divider: source.region }, choice];
    } else {
      return [...reducedChoices, choice];
    }
  }, []);

  return {
    errors: {
      'any.required': {
        message: config.errorMessage
      }
    },
    classes: 'radios-dividers-bold',
    choices
  };
};

/**
 * Form to request the supported source names
 *
 * @param {Object} request The Hapi request object
 * @returns {Object} object containing selected and default options for the form
 */
const form = request => {
  const { csrfToken } = request.view;
  const data = getChargeCategoryData(request);
  const { supportedSources } = request.pre;

  const action = getChargeCategoryActionUrl(request, ROUTING_CONFIG.supportedSourceName.step);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('supportedSourceId', getChoices(ROUTING_CONFIG.supportedSourceName, supportedSources), data.supportedSourceId || ''));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  supportedSourceId: Joi.string().uuid().required()
});

exports.schema = schema;

exports.form = form;
