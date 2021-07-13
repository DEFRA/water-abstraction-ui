const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');
const { humaniseUnits, groupLicenceConditions, humaniseAlertType } = require('../lib/helpers');

const checkFormMultipleRadio = request => {
  const f = formFactory(request.path);
  const mySession = session.get(request);

  const multipleLabel = (dataPayload, licenceRef = null) => {
    const item = dataPayload.filter(itemLabel => itemLabel.licenceRef === licenceRef)[0];
    return item.linkages.length > 1 ? ' Multiple tags' : ` ${humaniseAlertType(item.alertType)} at ${item.thresholdValue} ${humaniseUnits(item.thresholdUnit)}`;
  };

  const dataLicenceConditions = groupLicenceConditions(request);
  const dataUniqueLicences = dataLicenceConditions.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      value: item.licenceId,
      label: multipleLabel(dataLicenceConditions, item.licenceRef),
      hint: item.licenceRef,
      licenceRef: item.licenceRef,
      alertType: item.alertType,
      thresholdValue: item.thresholdValue,
      thresholdUnit: humaniseUnits(item.thresholdUnit),
      licenceId: item.licenceId
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
    choices: mySession.selectedLicence ? dataUniqueLicences.filter(item => item.value === mySession.selectedLicence.value) : []
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};
const checkSchemaMultipleRadio = () => Joi.object({
  selectedLicence: Joi.string().uuid().required(),
  csrf_token: Joi.string().uuid().required()
});

exports.form = checkFormMultipleRadio;
exports.schema = checkSchemaMultipleRadio;
