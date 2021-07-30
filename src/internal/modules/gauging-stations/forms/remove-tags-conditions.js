const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');
const { groupLicenceConditions, addCheckboxFields } = require('../lib/helpers');
const { createSchema } = require('shared/lib/joi.helpers');

const removeTagsConditionsForm = request => {
  const f = formFactory(request.path);
  const mySession = session.get(request);
  const dataLicenceConditions = groupLicenceConditions(request);
  const dataUniqueLicencesLinkedTags = dataLicenceConditions.map(item => ({
    licenceGaugingStationId: item.licenceGaugingStationId,
    licenceId: item.licenceId,
    licenceRef: item.licenceRef,
    alertType: item.alertType,
    thresholdValue: item.thresholdValue,
    thresholdUnit: item.thresholdUnit,
    dupeNum: item.linkages ? 1 : item.linkages.length,
    linkages: addCheckboxFields(item.linkages)
  })
  );
  const oneAndOnlyLicence = 0;
  let selectedTags = [];
  if (mySession.selectedLicence && dataUniqueLicencesLinkedTags) {
    selectedTags = dataUniqueLicencesLinkedTags.filter(itemLabel => itemLabel.licenceId === mySession.selectedLicence.value);
  }
  /* Handle case when selected item already deleted */
  const filteredChoices = !selectedTags.length ? [] : selectedTags[oneAndOnlyLicence].linkages;

  const requiredMessage = 'Select a licence tag';
  f.fields.push(fields.checkbox('selectedCondition', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'array.min': {
        message: 'At least one condition must be selected'
      },
      'array.required': {
        message: requiredMessage
      },
      'array.empty': {
        message: requiredMessage
      },
      'any.required': {
        message: requiredMessage
      },
      'any.empty': {
        message: requiredMessage
      }
    },
    choices: filteredChoices
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const removeTagsConditionsCustomValidation = () => true;

const removeTagsConditionsSchema = createSchema({
  selectedCondition: Joi.array().min(1),
  csrf_token: Joi.string().uuid().required()
});

exports.form = removeTagsConditionsForm;
exports.schema = removeTagsConditionsSchema;
exports.customValidation = removeTagsConditionsCustomValidation;
