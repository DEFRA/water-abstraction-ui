const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { toLongForm, groupLicenceConditions } = require('../../lib/helpers');
const { createSchema } = require('shared/lib/joi.helpers');

const removeTagsLicenceForm = request => {
  const f = formFactory(request.path);

  const multipleLabel = (dataPayload, licenceRef = null) => {
    const item = dataPayload.find(itemLabel => itemLabel.licenceRef === licenceRef);
    if (!item) {
      return '';
    }
    return item.linkages.length > 1 ? ' Multiple tags' : ` ${toLongForm(item.alertType, 'AlertType')} at ${item.thresholdValue} ${toLongForm(item.thresholdUnit, 'Units')}`;
  };

  const dataLicenceConditions = groupLicenceConditions(request);
  const dataRadioChoices = dataLicenceConditions.map(item => ({
    licenceGaugingStationId: item.licenceGaugingStationId,
    value: item.licenceId,
    label: item.licenceRef,
    licenceRef: item.licenceRef,
    hint: multipleLabel(dataLicenceConditions, item.licenceRef),
    alertType: item.alertType,
    thresholdValue: item.thresholdValue,
    thresholdUnit: toLongForm(item.thresholdUnit, 'Units'),
    licenceId: item.licenceId
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

const removeTagsLicenceSchema = () => {
  return createSchema({
    selectedLicence: Joi.string().min(1).required(),
    csrf_token: Joi.string().uuid().required()
  });
};

exports.form = removeTagsLicenceForm;
exports.schema = removeTagsLicenceSchema;
