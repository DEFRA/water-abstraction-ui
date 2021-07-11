const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { humaniseAlertType, humaniseUnits, maxDuplicates, addDuplicateIndex } = require('../lib/helpers');

const checkFormTags = request => {
  const f = formFactory(request.path);
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;
  const tempArr = [];

  const multipleLabel = (dataLabel, licenceRef, dupeMax) => {
    if (dupeMax > 1) {
      return ' Multiple tags';
    }
    const itemLabel0 = dataLabel.filter(itemLabel => itemLabel.licenceRef === licenceRef)[0];
    return ` ${humaniseAlertType(itemLabel0.alertType)} at ${itemLabel0.thresholdValue} ${humaniseUnits(itemLabel0.thresholdUnit)}`;
  };

  const dataWithNumbering = addDuplicateIndex(data, tempArr);
  const dataWithLicenceIdMultipleLabel = dataWithNumbering.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      value: item.licenceId,
      label: item.licenceRef,
      hint: multipleLabel(data, item.licenceRef, maxDuplicates(dataWithNumbering, item.licenceRef)),
      alertType: item.alertType,
      thresholdValue: item.thresholdValue,
      thresholdUnit: humaniseUnits(item.thresholdUnit),
      dupeNum: item.dupeNum,
      dupeMax: maxDuplicates(dataWithNumbering, item.licenceRef)
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
    choices: dataWithLicenceIdMultipleLabel.filter(item => item.dupeNum === item.dupeMax)
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
