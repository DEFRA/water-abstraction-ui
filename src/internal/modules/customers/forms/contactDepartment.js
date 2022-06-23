'use strict'

const { formFactory, fields } = require('shared/lib/forms/')
const Joi = require('joi')
const { get } = require('lodash')
const session = require('../session')

/**
 * Returns an object to update a contact
 * @param {Object} request The Hapi request object
  */
const updateContactDepartmentForm = request => {
  const f = formFactory(request.path)

  const department = get(session.get(request), 'departmentFromDatabase')

  f.fields.push(
    fields.text('department', {
      errors: {
        'string.empty': {
          message: 'Enter a department'
        }
      },
      label: 'Department name'
    }, department))

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))
  f.fields.push(fields.button(null, { label: 'Confirm' }))
  return f
}

const updateContactDepartmentSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  department: Joi.string().trim().replace(/\./g, '')
})

exports.schema = updateContactDepartmentSchema
exports.form = updateContactDepartmentForm
