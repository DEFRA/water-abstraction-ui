const formHelpers = require('shared/lib/forms');
const mappers = require('./mappers');
const { omit } = require('lodash');

const getNewChargeElementData = (form, request) => {
  const { defaultCharges } = request.pre;
  const { step } = request.params;
  const formData = formHelpers.getValues(form);
  return mappers[step] ? mappers[step](formData, defaultCharges) : omit(formData, 'csrf_token');
};

const saveChargeElementInformation = (form, request) => {
  const { draftChargeInformation } = request.pre;
  const { elementId } = request.params;

  const data = getNewChargeElementData(form, request);
  const chargeElementToUpdate = draftChargeInformation.chargeElements.find(element => element.id === elementId);
  chargeElementToUpdate
    ? Object.assign(chargeElementToUpdate, data)
    : draftChargeInformation.chargeElements.push({ ...data, id: elementId });

  request.setDraftChargeInformation(draftChargeInformation);
};

exports.saveChargeElementInformation = saveChargeElementInformation;
