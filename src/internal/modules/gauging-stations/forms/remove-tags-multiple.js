const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');
const { maxDuplicates, detailedLabel, addDuplicateIndex, humaniseUnits } = require('../lib/helpers');

const checkFormMultipleRadio = request => {
  const f = formFactory(request.path);
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;
  const mySession = session.get(request);
  const tempArr = [];

  const dataWithNumbering = addDuplicateIndex(data, tempArr);
  const dataWithLicenceId = dataWithNumbering.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      value: item.licenceId,
      label: detailedLabel(data, item.licenceRef, item.dupeNum),
      hint: item.licenceRef,
      alertType: item.alertType,
      thresholdValue: item.thresholdValue,
      thresholdUnit: humaniseUnits(item.thresholdUnit),
      dupeNum: item.dupeNum,
      dupeMax: maxDuplicates(dataWithNumbering, item.licenceRef)
    };
  });

  let selectedData = dataWithLicenceId;
  if (mySession.selectedLicence) {
    selectedData = dataWithLicenceId.filter(item => item.value === mySession.selectedLicence.value);
  }

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
    choices: selectedData
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
