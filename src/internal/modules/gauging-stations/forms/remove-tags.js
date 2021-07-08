const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { humanise, incrementDuplicates, maxDuplicates } = require('../lib/helpers');

const checkForm = request => {
  const f = formFactory(request.path);
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;

  let tempArr = [];

  const multipleLabel = (data, licenceRef, dupeMax) => {
    if (dupeMax > 1) {
      return ' Multiple tags';
    }
    let item = data.filter(item => { return item.licenceRef === licenceRef; })[0];
    return ` ${humanise(item.alertType)} at ${item.thresholdValue} ${item.thresholdUnit}`;
  };

  let dataWithNumbering = data.map(item => ({ licenceGaugingStationId: item.licenceGaugingStationId, licenceId: item.licenceId, licenceRef: item.licenceRef, dupeNum: incrementDuplicates(item.licenceRef, tempArr) }));
  let dataWithMax = dataWithNumbering.map(item => ({ licenceGaugingStationId: item.licenceGaugingStationId, value: item.licenceId, label: item.licenceRef, hint: multipleLabel(data, item.licenceRef, maxDuplicates(dataWithNumbering, item.licenceRef)), dupeNum: item.dupeNum, dupeMax: maxDuplicates(dataWithNumbering, item.licenceRef) }));

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
    choices: dataWithMax.filter(item => { return item.dupeNum === item.dupeMax; })
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
