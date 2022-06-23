'use strict'

const Joi = require('joi')

const { formFactory, fields } = require('shared/lib/forms/')
const { getCommonErrors, getAgreementStartDateValidator } = require('./lib/date-picker')
const { getFormAction } = require('./lib/routing')

const getDatePicker = licenceEndDate => {
  return fields.date('startDate', {
    label: 'Start date',
    isHeading: true,
    heading: true,
    size: 'm',
    hint: 'Enter a date that either matches the start date on some existing charge information or is 1 April',
    errors: {
      ...getCommonErrors(licenceEndDate),
      'any.required': {
        message: 'Enter the agreement start date.'
      },
      'any.only': {
        message: `You cannot use a date that is before the licence start date. You must enter a start date that matches some existing charge information or is 1 April. 
        If you need to use another date, you must set up new charge information first.`
      }
    }
  })
}

/**
 * Gets field description for financial agreement type radio buttons
 * @return {Object}
 */
const getCustomStartDateField = request => {
  const { endDate } = request.pre.licence

  return fields.radio('isCustomStartDate', {
    mapper: 'booleanMapper',
    label: 'Do you want to set a different agreement start date?',
    heading: true,
    size: 'm',
    errors: {
      'any.required': {
        message: 'Select yes if you want to set a different agreement start date'
      }
    },
    choices: [{
      value: true,
      label: 'Yes',
      fields: [
        getDatePicker(endDate)
      ]
    }, {
      value: false,
      label: 'No'
    }]
  })
}

/**
 * Gets form to select agreement type
 */
const checkStartDateForm = request => {
  const { csrfToken } = request.view

  const f = formFactory(getFormAction(request), 'POST')

  f.fields.push(getCustomStartDateField(request))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const checkStartDateSchema = request => {
  const { licence, chargeVersions } = request.pre

  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    isCustomStartDate: Joi.boolean().required(),
    startDate: Joi.when('isCustomStartDate', {
      is: true,
      then: getAgreementStartDateValidator(licence, chargeVersions.data)
    })
  })
}

exports.form = checkStartDateForm
exports.schema = checkStartDateSchema
