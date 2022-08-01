'use strict'

const Joi = require('joi')
const { isNull, isObject } = require('lodash')
const { formFactory, fields } = require('shared/lib/forms/')

const getValue = request => {
  const { contact } = request.pre.sessionData.data
  if (isNull(contact)) {
    return false
  }
  if (isObject(contact)) {
    return true
  }
  return undefined
}

/**
 * Form to request if an FAO contact should be added to the invoice account
 *
 * @param {Object} request The Hapi request object
  */
const addFaoForm = request => {
  const { csrfToken } = request.view

  const f = formFactory(request.path, 'POST')

  f.fields.push(fields.radio('faoRequired', {
    errors: {
      'any.required': {
        message: 'Select yes if you need to add a person or department as an FAO'
      }
    },
    choices: [
      {
        value: true,
        label: 'Yes'
      },
      {
        value: false,
        label: 'No'
      }
    ],
    hint: 'For example, FAO Sam Burridge or FAO Accounts department'
  }, getValue(request)))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const addFaoFormSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  faoRequired: Joi.boolean().required()
})

exports.form = addFaoForm
exports.schema = addFaoFormSchema
