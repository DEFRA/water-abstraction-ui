const { formFactory, fields } = require('shared/lib/forms/');
const JoiDate = require('@joi/date');
const Joi = require('joi').extend(JoiDate);
const { getAgreementEndDateValidator } = require('./lib/date-picker');

/**
 * Creates an object to represent the form for setting the
 * date for the end of an agreement
 *
 * @param {Object} request The Hapi request object
 * @param {String} action - the path to post to
 * @return {Object} form object
 */
const endAgreementForm = (request, endDate) => {
  const { csrfToken } = request.view;
  const { licenceId, agreementId } = request.params;
  const f = formFactory(`/licences/${licenceId}/agreements/${agreementId}/end`, 'POST');
  f.fields.push(fields.date('endDate', {
    type: 'date',
    caption: 'Enter a date that either matches the date some existing charge information ends or is 31 March.',
    errors: {
      'date.min': {
        message: `You cannot use a date that is before the agreement start date.
        It must either match the date some existing charge information ends or be 31 March.`
      },
      'any.required': {
        message: 'Enter the agreement end date.'
      },
      'any.only': {
        message: 'You must enter an end date that matches some existing charge information or is 31 March.'
      }
    }
  }, endDate));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'End agreement' }));
  return f;
};

const endAgreementFormSchema = (request, h) => {
  const { licence, chargeVersions, agreement } = request.pre;
  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    endDate: getAgreementEndDateValidator(licence, chargeVersions.data, agreement)
  });
};

exports.endAgreementForm = endAgreementForm;
exports.endAgreementFormSchema = endAgreementFormSchema;
