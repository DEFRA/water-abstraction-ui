const { formFactory, fields } = require('shared/lib/forms/');
const JoiDate = require('@hapi/joi-date');
const Joi = require('@hapi/joi').extend(JoiDate);
const moment = require('moment');

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
  const { licence, agreement } = request.pre;
  const f = formFactory(`/licences/${licenceId}/agreements/${agreementId}/end`, 'POST');
  f.fields.push(fields.date('endDate', {
    type: 'date',
    errors: {
      'any.required': {
        message: 'Enter the agreement end date'
      },
      'date.format': {
        message: 'Enter the agreement end date'
      },
      'any.empty': {
        message: 'Enter the agreement end date'
      },
      'date.base': {
        message: 'Enter the agreement end date'
      },
      'date.min': {
        message: `Enter an end date on or after the agreement start date (${moment(agreement.dateRange.startDate).format('DD-MM-YYYY')})`
      },
      'date.max': {
        message: `Enter an end date on or before the licence end date (${moment(licence.endDate).format('DD-MM-YYYY')})`
      }
    }
  }, endDate));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'End agreement' }));
  return f;
};

const endAgreementFormSchema = (request, h) => {
  const { licence, agreement } = request.pre;
  return {
    csrf_token: Joi.string().uuid().required(),
    endDate: Joi
      .date()
      .format('YYYY-MM-DD')
      .min(new Date(agreement.dateRange.startDate || '1000-1-1'))
      .max(new Date(licence.endDate || '3000-1-1'))
      .required()
  };
};

exports.endAgreementForm = endAgreementForm;
exports.endAgreementFormSchema = endAgreementFormSchema;
