const Joi = require('joi')
const { formFactory } = require('shared/lib/forms')
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common')
const { getUnderQueryField } = require('./fields/under-query')

exports.form = (request, data) => ({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getUnderQueryField(data.isUnderQuery),
    getContinueField('Submit')
  ]
})

exports.schema = () => Joi.object().keys({
  csrf_token: Joi.string().guid().required(),
  isUnderQuery: Joi.array().items(Joi.string().valid('under_query'))
})
