const Joi = require('joi')

const { formFactory } = require('shared/lib/forms')
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common')

exports.form = request => ({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getContinueField('Submit')
  ]
})

exports.schema = () => Joi.object({
  csrf_token: Joi.string().guid().required()
})
