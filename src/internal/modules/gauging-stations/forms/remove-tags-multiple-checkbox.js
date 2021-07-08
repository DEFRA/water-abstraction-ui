const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');
const { humanise, incrementDuplicates, maxDuplicates } = require('../lib/helpers');

const checkForm = request => {
  const f = formFactory(request.path);
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;
  const mySession = session.get(request);

  let tempArr = [];

  const detailedLabel = (data, licenceRef, dupeNum) => {
    let item = data.filter(item => { return item.licenceRef === licenceRef; })[dupeNum - 1];
    return ` ${humanise(item.alertType)} at ${item.thresholdValue} ${item.thresholdUnit}`;
  };

  let dataWithNumbering = data.map(item => ({ licenceId: item.licenceId, licenceRef: item.licenceRef, dupeNum: incrementDuplicates(item.licenceRef, tempArr) }));
  let dataWithMax = dataWithNumbering.map(item => ({ value: item.licenceId + ':' + item.dupeNum, licenceId: item.licenceId, label: detailedLabel(data, item.licenceRef, item.dupeNum), hint: item.licenceRef, dupeNum: item.dupeNum, dupeMax: maxDuplicates(dataWithNumbering, item.licenceRef) }));
  let selectedData = dataWithMax.filter(item => { return item.licenceId === mySession.selectedLicence.value; });

  f.fields.push(fields.checkbox('selectedLicenceCheckbox', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'any.required': {
        message: 'Select a licence tag'
      },
      'any.empty': {
        message: 'Select a licence tag'
      }
    },
    choices: selectedData
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const checkSchema = () => Joi.object({
  selectedLicenceCheckbox: Joi.array().required(),
  csrf_token: Joi.string().uuid().required()
});

exports.form = checkForm;
exports.schema = checkSchema;
