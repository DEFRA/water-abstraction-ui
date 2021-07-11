const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { humaniseAlertType, humaniseUnits, maxDuplicates, addDuplicateIndex } = require('../lib/helpers');

const checkForm = request => {
  const f = formFactory(request.path);
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;
  const tempArr = [];

  const multipleLabel = (dataLabel, licenceRef, dupeMax) => {
    if (dupeMax > 1) {
      return ' Multiple tags';
    }
    const itemLabel = dataLabel.filter(itemLabel => {
      return itemLabel.licenceRef === licenceRef;
    })[0];
    return ` ${humaniseAlertType(itemLabel.alertType)} at ${itemLabel.thresholdValue} ${humaniseUnits(itemLabel.thresholdUnit)}`;
  };

  const dataWithNumbering = addDuplicateIndex(data, tempArr);
  const dataWithLicenceIdMultipleLabel = dataWithNumbering.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      value: item.licenceId,
      label: item.licenceRef,
      hint: multipleLabel(data, item.licenceRef, maxDuplicates(dataWithNumbering, item.licenceRef)),
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
    choices: dataWithLicenceIdMultipleLabel.filter(item => { return item.dupeNum === item.dupeMax; })
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const checkSchema = () => Joi.object({
  selectedLicence: Joi.string().uuid().required(),
  csrf_token: Joi.string().uuid().required()
});

exports.form = checkForm;
exports.schema = checkSchema;
