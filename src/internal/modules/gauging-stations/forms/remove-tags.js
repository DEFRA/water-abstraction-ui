const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { humaniseAlertType, humaniseUnits, groupLicenceConditions } = require('../lib/helpers');

const checkFormTags = request => {
  const f = formFactory(request.path);

  const multipleLabel = (dataPayload, licenceRef = null) => {
    const item = dataPayload.filter(itemLabel => itemLabel.licenceRef === licenceRef)[0];
    return item.linkages.length > 1 ? ' Multiple tags' : ` ${humaniseAlertType(item.alertType)} at ${item.thresholdValue} ${humaniseUnits(item.thresholdUnit)}`;
  };

  const dataLicenceConditions = groupLicenceConditions(request);
  const dataRadioChoices = dataLicenceConditions.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      value: item.licenceId,
      label: item.licenceRef,
      hint: multipleLabel(dataLicenceConditions, item.licenceRef),
      alertType: item.alertType,
      thresholdValue: item.thresholdValue,
      thresholdUnit: humaniseUnits(item.thresholdUnit)
    };
  });

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

const checkSchemaTags = () => Joi.object({
  selectedLicence: Joi.string().uuid().required(),
  csrf_token: Joi.string().uuid().required()
});

exports.form = checkFormTags;
exports.schema = checkSchemaTags;
