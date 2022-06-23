const Joi = require('joi')
const { get } = require('lodash')
const { formFactory, fields } = require('shared/lib/forms/')
const session = require('../../lib/session')

const sendAlertEmailAddressForm = request => {
  const f = formFactory(request.path)

  const useLoggedInUserEmailAddress = get(session.get(request), 'useLoggedInUserEmailAddress.value')
  const customEmailAddress = get(session.get(request), 'customEmailAddress.value')

  f.fields.push(fields.radio('useLoggedInUserEmailAddress', {
    errors: {
      'any.required': {
        message: 'Enter an email address'
      }
    },
    choices: [{
      value: true,
      label: request.defra.userName
    },
    {
      divider: 'or'
    },
    {
      value: false,
      label: 'Use another email address',
      fields: [
        fields.text('customEmailAddress', {
          label: 'Email address',
          errors: {
            'string.empty': {
              message: 'Enter an email address'
            },
            'string.email': {
              message: 'Enter an email address in the correct format, like name@example.com'
            }
          },
          hint: 'This is usually your area’s team email address'
        }, customEmailAddress)
      ]
    }
    ]
  }, useLoggedInUserEmailAddress))

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))
  return f
}

const sendAlertEmailAddressSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  useLoggedInUserEmailAddress: Joi.boolean().required(),
  customEmailAddress: Joi.when('useLoggedInUserEmailAddress', {
    is: true,
    then: Joi.any(),
    otherwise: Joi.string().email().required()
  })
})

exports.form = sendAlertEmailAddressForm
exports.schema = sendAlertEmailAddressSchema
