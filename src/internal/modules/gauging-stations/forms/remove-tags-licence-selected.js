const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');
const { toLongForm, groupLicenceConditions } = require('../lib/helpers');

const removeTagsLicenceSelectedForm = request => {
  const f = formFactory(request.path);
  const mySession = session.get(request);

  const multipleLabel = (dataPayload, licenceRef = null) => {
    const item = dataPayload.find(itemLabel => itemLabel.licenceRef === licenceRef);
    if (!item) {
      return '';
    }
    return item.linkages.length > 1 ? ' Multiple tags' : ` ${toLongForm(item.alertType, 'AlertType')} at ${item.thresholdValue} ${toLongForm(item.thresholdUnit, 'Units')}`;
  };

  const dataLicenceConditions = groupLicenceConditions(request);
  const dataUniqueLicences = dataLicenceConditions.map(item => ({
    licenceGaugingStationId: item.licenceGaugingStationId,
    value: item.licenceId,
    label: multipleLabel(dataLicenceConditions, item.licenceRef),
    hint: item.licenceRef,
    licenceRef: item.licenceRef,
    alertType: item.alertType,
    thresholdValue: item.thresholdValue,
    thresholdUnit: toLongForm(item.thresholdUnit, 'Units'),
    licenceId: item.licenceId
  })
  );

  const radioChoices = mySession.selectedLicence ? dataUniqueLicences.filter(item => item.value === mySession.selectedLicence.value) : [];

  f.fields.push(fields.radio('selectedLicence', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'any.required': {
        message: 'Select a licence number'
      },
      'any.empty': {
        message: 'Select a licence number'
      }
    },
    choices: radioChoices
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const removeTagsLicenceSelectedSchema = Joi.object().keys({
  selectedLicence: Joi.string().required().trim().max(9000),
  csrf_token: Joi.string().guid()
});

const removeTagsLicenceSelectedCustomValidation = () => true;

exports.form = removeTagsLicenceSelectedForm;
exports.schema = removeTagsLicenceSelectedSchema;
exports.customValidation = removeTagsLicenceSelectedCustomValidation;
