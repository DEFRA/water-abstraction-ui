
const { formFactory, fields } = require('shared/lib/forms/');
const Joi = require('joi');
const { getChargeCategoryActionUrl } = require('../../lib/form-helpers');
const { ROUTING_CONFIG } = require('../../lib/charge-categories/constants');

const mapElementToChoice = (element, index) => {
  return {
    value: element.id,
    label: element.description,
    hint: `Element ${index + 1}`
  };
};

const getSelectableElements = request => {
  const { draftChargeInformation } = request.pre;
  const { elementId } = request.params;
  const unassigned = draftChargeInformation.chargeElements.filter(element => element.scheme === 'alcs');
  const { chargePurposes } = draftChargeInformation.chargeElements.find(({ id, scheme }) => id === elementId && scheme === 'sroc');
  const assigned = chargePurposes.map(purpose => ({ ...purpose, checked: true }));
  return [...unassigned, ...assigned];
};

/**
 * Form to request which element is applied
 *
 * @param {Object} request The Hapi request object
 * @returns {Object} object containing selected and default options for the form
 */
const form = request => {
  const { csrfToken } = request.view;

  const selectableElements = getSelectableElements(request);

  const action = getChargeCategoryActionUrl(request, ROUTING_CONFIG.whichElement.step);

  const f = formFactory(action, 'POST');

  const { pageTitle, caption } = ROUTING_CONFIG.whichElement;

  f.fields.push(fields.checkbox('selectedElementIds', {
    pageTitle,
    caption,
    heading: true,
    size: 'l',
    mapper: 'arrayMapper',
    controlClass: 'form-control form-control--small',
    choices: selectableElements.map(mapElementToChoice),
    errors: {
      'array.min': {
        message: 'You need to select at least one element'
      }
    }
  }, getSelectableElements(request).filter(element => element.checked).map(element => element.id)));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = request => {
  const selectableElementIds = getSelectableElements(request).map(element => element.id);
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    selectedElementIds: Joi.array().min(1).items(
      Joi.string().guid().valid(...selectableElementIds)
    )
  });
};

exports.schema = schema;

exports.form = form;
