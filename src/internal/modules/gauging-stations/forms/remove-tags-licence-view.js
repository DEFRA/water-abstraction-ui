const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { toLongForm, groupLicenceConditions } = require('../lib/helpers');

const removeTagsLicenceForm = request => {
  const f = formFactory(request.path);

  const multipleLabel = (dataPayload, licenceRef = null) => {
    const item = dataPayload.filter(itemLabel => itemLabel.licenceRef === licenceRef);
    if (!item) {
      return '';
    }
    const licence = item[0];
    return licence.linkages.length > 1 ? ' Multiple tags' : ` ${toLongForm(licence.alertType, 'AlertType')} at ${licence.thresholdValue} ${toLongForm(licence.thresholdUnit, 'Units')}`;
  };

  const dataLicenceConditions = groupLicenceConditions(request);
  const dataRadioChoices = dataLicenceConditions.map(item => ({
    licenceGaugingStationId: item.licenceGaugingStationId,
    value: item.licenceId,
    label: item.licenceRef,
    hint: multipleLabel(dataLicenceConditions, item.licenceRef),
    alertType: item.alertType,
    thresholdValue: item.thresholdValue,
    thresholdUnit: toLongForm(item.thresholdUnit, 'Units')
  })
  );

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
    choices: dataRadioChoices
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const removeTagsLicenceSchema = Joi.array().items(Joi.object({
  selectedLicence: Joi.string().uuid().required(),
  csrf_token: Joi.string().uuid().required()
}));

exports.form = removeTagsLicenceForm;
exports.schema = removeTagsLicenceSchema;
